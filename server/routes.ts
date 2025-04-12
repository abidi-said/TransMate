import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, hashPassword } from "./auth";
import { setupStripePayment } from "./payment/stripe";
import { setupTunisianPayment } from "./payment/tunisia";
import OpenAI from "openai";
import fs from "fs";
import path from "path";
import { glob } from "glob";
import { TransmateConfig } from "@shared/schema";
import { WebSocketServer, WebSocket } from "ws";
import { setupWebSocketServer } from "./websocket";

// Request middleware to ensure user is authenticated
function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
}

// OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up auth routes
  setupAuth(app);
  
  // Set up payment routes
  setupStripePayment(app);
  setupTunisianPayment(app);
  
  // Project routes
  app.get("/api/projects", requireAuth, async (req, res) => {
    try {
      const projects = await storage.getProjectsByUser(req.user.id);
      res.json(projects);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });
  
  app.post("/api/projects", requireAuth, async (req, res) => {
    try {
      const { name, description, defaultLanguage } = req.body;
      
      if (!name || !defaultLanguage) {
        return res.status(400).json({ message: "Name and default language are required" });
      }
      
      const project = await storage.createProject({
        name,
        description: description || "",
        defaultLanguage,
        createdBy: req.user.id
      });
      
      // Create default language
      const language = await storage.createLanguage({
        projectId: project.id,
        code: defaultLanguage,
        name: getLanguageName(defaultLanguage),
        isDefault: true
      });
      
      // Create default project settings
      await storage.createOrUpdateProjectSettings({
        projectId: project.id,
        translationFilePath: `./src/locales/{language}.json`,
        sourcePatterns: ["./src/**/*.{ts,tsx,js,jsx}"],
        ignorePatterns: ["./src/**/*.test.{ts,tsx,js,jsx}"],
        aiTranslationEnabled: true,
        aiProvider: "openai",
        aiModel: "gpt-4o",
        aiInstructions: "Translate the following text while preserving any placeholders, variables or formatting."
      });
      
      // Log activity
      await storage.logActivity({
        projectId: project.id,
        userId: req.user.id,
        action: "created",
        resourceType: "project",
        resourceId: project.id,
        details: { name: project.name }
      });
      
      res.status(201).json(project);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });
  
  app.get("/api/projects/:id", requireAuth, async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const project = await storage.getProject(projectId);
      
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      // Check if user has access to this project
      const projects = await storage.getProjectsByUser(req.user.id);
      if (!projects.some(p => p.id === projectId)) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      res.json(project);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });
  
  // Project members routes
  app.get("/api/projects/:id/members", requireAuth, async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      
      // Check if user has access to this project
      const projects = await storage.getProjectsByUser(req.user.id);
      if (!projects.some(p => p.id === projectId)) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const members = await storage.getProjectMembers(projectId);
      res.json(members);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });
  
  app.post("/api/projects/:id/members", requireAuth, async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const { email, role } = req.body;
      
      if (!email || !role) {
        return res.status(400).json({ message: "Email and role are required" });
      }
      
      // Check if user is admin of this project
      const members = await storage.getProjectMembers(projectId);
      const isAdmin = members.some(m => m.userId === req.user.id && m.role === "admin");
      
      if (!isAdmin) {
        return res.status(403).json({ message: "Only admins can add members" });
      }
      
      // Find user by email
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Check if user is already a member
      if (members.some(m => m.user.id === user.id)) {
        return res.status(400).json({ message: "User is already a member of this project" });
      }
      
      // Add user to project
      const member = await storage.addProjectMember({
        projectId,
        userId: user.id,
        role
      });
      
      // Log activity
      await storage.logActivity({
        projectId,
        userId: req.user.id,
        action: "added",
        resourceType: "member",
        resourceId: user.id,
        details: { username: user.username, role }
      });
      
      res.status(201).json({ ...member, user });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });
  
  // Language routes
  app.get("/api/projects/:id/languages", requireAuth, async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      
      // Check if user has access to this project
      const projects = await storage.getProjectsByUser(req.user.id);
      if (!projects.some(p => p.id === projectId)) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const languages = await storage.getLanguages(projectId);
      res.json(languages);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });
  
  app.post("/api/projects/:id/languages", requireAuth, async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const { code, name } = req.body;
      
      if (!code) {
        return res.status(400).json({ message: "Language code is required" });
      }
      
      // Check if user has access to this project
      const projects = await storage.getProjectsByUser(req.user.id);
      if (!projects.some(p => p.id === projectId)) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Check if language already exists
      const languages = await storage.getLanguages(projectId);
      if (languages.some(l => l.code === code)) {
        return res.status(400).json({ message: "Language already exists" });
      }
      
      const language = await storage.createLanguage({
        projectId,
        code,
        name: name || getLanguageName(code),
        isDefault: false
      });
      
      // Log activity
      await storage.logActivity({
        projectId,
        userId: req.user.id,
        action: "added",
        resourceType: "language",
        resourceId: language.id,
        details: { code, name: language.name }
      });
      
      res.status(201).json(language);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });
  
  // Translation file routes
  app.get("/api/projects/:id/files", requireAuth, async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      
      // Check if user has access to this project
      const projects = await storage.getProjectsByUser(req.user.id);
      if (!projects.some(p => p.id === projectId)) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const files = await storage.getTranslationFiles(projectId);
      res.json(files);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });
  
  // Translation key routes
  app.get("/api/projects/:id/keys", requireAuth, async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      
      // Check if user has access to this project
      const projects = await storage.getProjectsByUser(req.user.id);
      if (!projects.some(p => p.id === projectId)) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const keys = await storage.getTranslationKeys(projectId);
      res.json(keys);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });
  
  app.post("/api/projects/:id/keys", requireAuth, async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const { key, description, defaultValue } = req.body;
      
      if (!key) {
        return res.status(400).json({ message: "Key is required" });
      }
      
      // Check if user has access to this project
      const projects = await storage.getProjectsByUser(req.user.id);
      if (!projects.some(p => p.id === projectId)) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Check if key already exists
      const existingKey = await storage.getTranslationKeyByKey(projectId, key);
      if (existingKey) {
        return res.status(400).json({ message: "Key already exists" });
      }
      
      // Create key
      const translationKey = await storage.createTranslationKey({
        projectId,
        key,
        description: description || "",
        tags: []
      });
      
      // Get default language
      const languages = await storage.getLanguages(projectId);
      const defaultLanguage = languages.find(l => l.isDefault);
      
      if (defaultLanguage && defaultValue) {
        // Create translation for default language
        await storage.createTranslation({
          keyId: translationKey.id,
          languageId: defaultLanguage.id,
          value: defaultValue,
          isApproved: true,
          isAiGenerated: false,
          createdBy: req.user.id
        });
      }
      
      // Log activity
      await storage.logActivity({
        projectId,
        userId: req.user.id,
        action: "added",
        resourceType: "key",
        resourceId: translationKey.id,
        details: { key: translationKey.key }
      });
      
      res.status(201).json(translationKey);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });
  
  // Translation routes
  app.get("/api/keys/:id/translations", requireAuth, async (req, res) => {
    try {
      const keyId = parseInt(req.params.id);
      
      // Get the key
      const key = await storage.getTranslationKey(keyId);
      if (!key) {
        return res.status(404).json({ message: "Key not found" });
      }
      
      // Check if user has access to this project
      const projects = await storage.getProjectsByUser(req.user.id);
      if (!projects.some(p => p.id === key.projectId)) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const translations = await storage.getTranslations(keyId);
      res.json(translations);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });
  
  app.post("/api/keys/:id/translations", requireAuth, async (req, res) => {
    try {
      const keyId = parseInt(req.params.id);
      const { languageId, value } = req.body;
      
      if (!languageId || value === undefined) {
        return res.status(400).json({ message: "Language ID and value are required" });
      }
      
      // Get the key
      const key = await storage.getTranslationKey(keyId);
      if (!key) {
        return res.status(404).json({ message: "Key not found" });
      }
      
      // Check if user has access to this project
      const projects = await storage.getProjectsByUser(req.user.id);
      if (!projects.some(p => p.id === key.projectId)) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Check if translation already exists
      const existingTranslation = await storage.getTranslationByLanguage(keyId, languageId);
      
      if (existingTranslation) {
        // Update existing translation
        const updated = await storage.updateTranslation(existingTranslation.id, {
          value,
          isApproved: false,
          updatedAt: new Date()
        });
        
        // Log activity
        await storage.logActivity({
          projectId: key.projectId,
          userId: req.user.id,
          action: "updated",
          resourceType: "translation",
          resourceId: existingTranslation.id,
          details: { key: key.key }
        });
        
        res.json(updated);
      } else {
        // Create new translation
        const translation = await storage.createTranslation({
          keyId,
          languageId,
          value,
          isApproved: false,
          isAiGenerated: false,
          createdBy: req.user.id
        });
        
        // Log activity
        await storage.logActivity({
          projectId: key.projectId,
          userId: req.user.id,
          action: "added",
          resourceType: "translation",
          resourceId: translation.id,
          details: { key: key.key }
        });
        
        res.status(201).json(translation);
      }
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });
  
  // AI Translation route
  app.post("/api/translate", requireAuth, async (req, res) => {
    try {
      const { text, sourceLanguage, targetLanguage, projectId } = req.body;
      
      if (!text || !sourceLanguage || !targetLanguage) {
        return res.status(400).json({ message: "Text, source language, and target language are required" });
      }
      
      if (projectId) {
        // Check if user has access to this project
        const projects = await storage.getProjectsByUser(req.user.id);
        if (!projects.some(p => p.id === projectId)) {
          return res.status(403).json({ message: "Access denied" });
        }
        
        // Get project settings
        const settings = await storage.getProjectSettings(projectId);
        
        // Check if AI translation is enabled
        if (settings && !settings.aiTranslationEnabled) {
          return res.status(400).json({ message: "AI translation is not enabled for this project" });
        }
      }
      
      // Translate text using OpenAI
      const sourceLangName = getLanguageName(sourceLanguage);
      const targetLangName = getLanguageName(targetLanguage);
      
      const prompt = `Translate the following text from ${sourceLangName} to ${targetLangName}. 
Preserve any formatting, variables, or placeholders exactly as they appear in the original.
Maintain the tone and style of the original text.
Only respond with the translation, nothing else.

Text to translate: "${text}"

Translation:`;
      
      // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: "You are a professional translator with expertise in multiple languages and technical terminology." },
          { role: "user", content: prompt }
        ],
        temperature: 0.3
      });
      
      const translation = response.choices[0].message.content?.trim() || "";
      
      // Store in translation memory if projectId is provided
      if (projectId) {
        await storage.addTranslationMemoryEntry({
          projectId,
          sourceLanguage,
          targetLanguage,
          sourceText: text,
          targetText: translation
        });
      }
      
      res.json({ translation });
    } catch (err: any) {
      console.error("AI translation error:", err);
      res.status(500).json({ message: `Translation failed: ${err.message}` });
    }
  });
  
  // Bulk Translation route
  app.post("/api/projects/:id/bulk-translate", requireAuth, async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const { sourceLanguage, targetLanguages, selection } = req.body;
      
      if (!sourceLanguage || !targetLanguages || !Array.isArray(targetLanguages) || targetLanguages.length === 0) {
        return res.status(400).json({ message: "Source language and at least one target language are required" });
      }
      
      // Check if user has access to this project
      const projects = await storage.getProjectsByUser(req.user.id);
      if (!projects.some(p => p.id === projectId)) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Get project settings
      const settings = await storage.getProjectSettings(projectId);
      
      // Check if AI translation is enabled
      if (!settings || !settings.aiTranslationEnabled) {
        return res.status(400).json({ message: "AI translation is not enabled for this project" });
      }
      
      // Get languages
      const languages = await storage.getLanguages(projectId);
      const sourceLanguageObj = languages.find(l => l.code === sourceLanguage);
      
      if (!sourceLanguageObj) {
        return res.status(400).json({ message: "Source language not found" });
      }
      
      // Get translation keys
      const keys = await storage.getTranslationKeys(projectId);
      
      // Process in batches to avoid overwhelming the API
      const batchSize = 10;
      let processed = 0;
      let failed = 0;
      
      // Function to process a batch
      const processBatch = async (batch: typeof keys) => {
        for (const key of batch) {
          try {
            // Get source translation
            const sourceTranslation = await storage.getTranslationByLanguage(key.id, sourceLanguageObj.id);
            
            if (!sourceTranslation) {
              continue; // Skip if no source translation
            }
            
            // Process each target language
            for (const targetLangCode of targetLanguages) {
              const targetLang = languages.find(l => l.code === targetLangCode);
              
              if (!targetLang || targetLang.id === sourceLanguageObj.id) {
                continue; // Skip if target language not found or same as source
              }
              
              // Check if translation exists
              const existingTranslation = await storage.getTranslationByLanguage(key.id, targetLang.id);
              
              // Skip if translation exists and not overriding
              if (existingTranslation && selection === "missing") {
                continue;
              }
              
              // Translate text using OpenAI
              const translation = await translateText(sourceTranslation.value, sourceLanguage, targetLangCode, settings);
              
              if (existingTranslation) {
                // Update existing translation
                await storage.updateTranslation(existingTranslation.id, {
                  value: translation,
                  isAiGenerated: true,
                  updatedAt: new Date()
                });
              } else {
                // Create new translation
                await storage.createTranslation({
                  keyId: key.id,
                  languageId: targetLang.id,
                  value: translation,
                  isApproved: false,
                  isAiGenerated: true,
                  createdBy: req.user.id
                });
              }
            }
            
            processed++;
          } catch (error) {
            failed++;
            console.error(`Error translating key ${key.key}:`, error);
          }
        }
      };
      
      // Process in batches
      const batches = [];
      for (let i = 0; i < keys.length; i += batchSize) {
        batches.push(keys.slice(i, i + batchSize));
      }
      
      // Start processing (don't wait for completion)
      res.json({ 
        message: "Bulk translation started", 
        totalKeys: keys.length,
        targetLanguages: targetLanguages.length
      });
      
      // Continue processing after response is sent
      for (const batch of batches) {
        await processBatch(batch);
      }
      
      // Log activity
      await storage.logActivity({
        projectId,
        userId: req.user.id,
        action: "bulk-translated",
        resourceType: "project",
        resourceId: projectId,
        details: { processed, failed, targetLanguages }
      });
      
    } catch (err: any) {
      console.error("Bulk translation error:", err);
      res.status(500).json({ message: `Bulk translation failed: ${err.message}` });
    }
  });
  
  // Activity logs route
  app.get("/api/projects/:id/activity", requireAuth, async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      
      // Check if user has access to this project
      const projects = await storage.getProjectsByUser(req.user.id);
      if (!projects.some(p => p.id === projectId)) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const logs = await storage.getActivityLogs(projectId, limit);
      res.json(logs);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });
  
  // Project settings routes
  app.get("/api/projects/:id/settings", requireAuth, async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      
      // Check if user has access to this project
      const projects = await storage.getProjectsByUser(req.user.id);
      if (!projects.some(p => p.id === projectId)) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const settings = await storage.getProjectSettings(projectId);
      res.json(settings || { projectId });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });
  
  app.post("/api/projects/:id/settings", requireAuth, async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      
      // Check if user has access to this project
      const projects = await storage.getProjectsByUser(req.user.id);
      if (!projects.some(p => p.id === projectId)) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Update settings
      const settings = await storage.createOrUpdateProjectSettings({
        ...req.body,
        projectId,
        updatedAt: new Date()
      });
      
      // Log activity
      await storage.logActivity({
        projectId,
        userId: req.user.id,
        action: "updated",
        resourceType: "settings",
        resourceId: projectId,
        details: { settings: req.body }
      });
      
      res.json(settings);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });
  
  // API keys routes
  app.get("/api/api-keys", requireAuth, async (req, res) => {
    try {
      const apiKeys = await storage.getApiKeys(req.user.id);
      
      // Don't send full key values for security
      const redactedKeys = apiKeys.map(key => ({
        ...key,
        key: `xtm_${key.key.substring(0, 3)}${'•'.repeat(16)}`
      }));
      
      res.json(redactedKeys);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });
  
  app.post("/api/api-keys", requireAuth, async (req, res) => {
    try {
      const { name } = req.body;
      
      if (!name) {
        return res.status(400).json({ message: "API key name is required" });
      }
      
      // Generate random API key
      const key = `xtm_${randomString(32)}`;
      
      const apiKey = await storage.createApiKey({
        userId: req.user.id,
        name,
        key
      });
      
      res.status(201).json(apiKey);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });
  
  app.delete("/api/api-keys/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Get the API key first to verify ownership
      const apiKeys = await storage.getApiKeys(req.user.id);
      const apiKey = apiKeys.find(key => key.id === id);
      
      if (!apiKey) {
        return res.status(404).json({ message: "API key not found" });
      }
      
      await storage.deleteApiKey(id);
      res.status(204).send();
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });
  
  // CLI commands simulation routes
  app.post("/api/cli/extract-keys", requireAuth, async (req, res) => {
    try {
      const { projectId, add = false } = req.body;
      
      if (!projectId) {
        return res.status(400).json({ message: "Project ID is required" });
      }
      
      // Check if user has access to this project
      const projects = await storage.getProjectsByUser(req.user.id);
      if (!projects.some(p => p.id === projectId)) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Get project settings
      const settings = await storage.getProjectSettings(projectId);
      if (!settings) {
        return res.status(400).json({ message: "Project settings not found" });
      }
      
      // Simulate CLI extract-keys command
      // In a real implementation, this would scan source files for translation keys
      const extractedKeys = ["common.buttons.submit", "common.buttons.cancel", "auth.login.title"];
      const result = {
        extracted: extractedKeys.length,
        added: 0
      };
      
      if (add) {
        // Add extracted keys to the project
        for (const key of extractedKeys) {
          const existing = await storage.getTranslationKeyByKey(projectId, key);
          if (!existing) {
            await storage.createTranslationKey({
              projectId,
              key,
              description: `Automatically extracted key: ${key}`,
              tags: ["auto-extracted"]
            });
            result.added++;
          }
        }
      }
      
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });
  
  app.post("/api/cli/add-key", requireAuth, async (req, res) => {
    try {
      const { projectId, key, value, translate = false } = req.body;
      
      if (!projectId || !key || !value) {
        return res.status(400).json({ message: "Project ID, key, and value are required" });
      }
      
      // Check if user has access to this project
      const projects = await storage.getProjectsByUser(req.user.id);
      if (!projects.some(p => p.id === projectId)) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Check if key already exists
      const existingKey = await storage.getTranslationKeyByKey(projectId, key);
      if (existingKey) {
        return res.status(400).json({ message: "Key already exists" });
      }
      
      // Get languages
      const languages = await storage.getLanguages(projectId);
      const defaultLanguage = languages.find(l => l.isDefault);
      
      if (!defaultLanguage) {
        return res.status(400).json({ message: "Default language not found" });
      }
      
      // Create key
      const translationKey = await storage.createTranslationKey({
        projectId,
        key,
        description: "",
        tags: ["cli-added"]
      });
      
      // Create translation for default language
      await storage.createTranslation({
        keyId: translationKey.id,
        languageId: defaultLanguage.id,
        value,
        isApproved: true,
        isAiGenerated: false,
        createdBy: req.user.id
      });
      
      // Translate to other languages if requested
      const result = {
        key,
        added: true,
        translations: { [defaultLanguage.code]: value }
      };
      
      if (translate) {
        // Get project settings
        const settings = await storage.getProjectSettings(projectId);
        
        if (settings && settings.aiTranslationEnabled) {
          for (const language of languages) {
            if (language.id === defaultLanguage.id) continue;
            
            try {
              const translation = await translateText(value, defaultLanguage.code, language.code, settings);
              
              await storage.createTranslation({
                keyId: translationKey.id,
                languageId: language.id,
                value: translation,
                isApproved: false,
                isAiGenerated: true,
                createdBy: req.user.id
              });
              
              result.translations[language.code] = translation;
            } catch (error) {
              console.error(`Error translating to ${language.code}:`, error);
            }
          }
        }
      }
      
      res.status(201).json(result);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });
  
  app.post("/api/cli/sync", requireAuth, async (req, res) => {
    try {
      const { projectId, source, format = "csv", merge = "override" } = req.body;
      
      if (!projectId || !source) {
        return res.status(400).json({ message: "Project ID and source are required" });
      }
      
      // Check if user has access to this project
      const projects = await storage.getProjectsByUser(req.user.id);
      if (!projects.some(p => p.id === projectId)) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Simulate CLI sync command
      // In a real implementation, this would parse the source file and sync translations
      const result = {
        added: 12,
        updated: 8,
        skipped: 3
      };
      
      // Log activity
      await storage.logActivity({
        projectId,
        userId: req.user.id,
        action: "synced",
        resourceType: "project",
        resourceId: projectId,
        details: { source, format, merge, ...result }
      });
      
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });
  
  // Create the HTTP server
  const httpServer = createServer(app);
  
  // Set up WebSocket server for real-time collaborative editing
  setupWebSocketServer(httpServer);
  
  return httpServer;
}

// Helper function to generate a random string
function randomString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Helper function to get full language name from code
function getLanguageName(code: string): string {
  const languages: Record<string, string> = {
    en: "English",
    fr: "French",
    de: "German",
    es: "Spanish",
    it: "Italian",
    pt: "Portuguese",
    ru: "Russian",
    zh: "Chinese",
    ja: "Japanese",
    ko: "Korean",
    ar: "Arabic",
    hi: "Hindi",
    nl: "Dutch",
    pl: "Polish",
    tr: "Turkish",
    sv: "Swedish",
    da: "Danish",
    no: "Norwegian",
    fi: "Finnish",
    cs: "Czech",
    hu: "Hungarian",
    ro: "Romanian",
    bg: "Bulgarian",
    el: "Greek",
    uk: "Ukrainian",
    th: "Thai",
    vi: "Vietnamese",
  };
  
  return languages[code] || code;
}

// Helper function to translate text
async function translateText(text: string, fromLang: string, toLang: string, settings: any): Promise<string> {
  const sourceLangName = getLanguageName(fromLang);
  const targetLangName = getLanguageName(toLang);
  
  let instructions = "Translate while preserving any placeholders, variables or formatting.";
  if (settings && settings.aiInstructions) {
    instructions = settings.aiInstructions;
  }
  
  const prompt = `Translate the following text from ${sourceLangName} to ${targetLangName}.
${instructions}
Only respond with the translation, nothing else.

Text to translate: "${text}"

Translation:`;
  
  // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
  const model = settings && settings.aiModel ? settings.aiModel : "gpt-4o";
  
  const response = await openai.chat.completions.create({
    model,
    messages: [
      { role: "system", content: "You are a professional translator with expertise in multiple languages and technical terminology." },
      { role: "user", content: prompt }
    ],
    temperature: 0.3
  });
  
  return response.choices[0].message.content?.trim() || text;
}
