/**
 * Cloud Logger - Streams logs to Supabase for remote debugging
 * 
 * This allows you to debug React Native apps running on physical devices
 * without needing to connect to a computer or view console logs.
 * 
 * Features:
 * - Batching: Logs are batched and sent every 5 seconds to reduce network calls
 * - Filtering: Only logs matching specified categories/levels are sent
 * - Device info: Automatically captures platform, OS version, app version
 * - Session tracking: Groups logs by app session
 * - Error handling: Fails silently if Supabase is unavailable
 * 
 * @example
 * ```ts
 * import { cloudLog } from '@lib/cloudLogger';
 * 
 * cloudLog.info('ads', 'AdMob SDK initialized', { appId: 'ca-app-pub-xxx' });
 * cloudLog.error('ads', 'Failed to load ad', { error: err.message });
 * ```
 */

import { supabase } from './supabase';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';
type LogCategory = 'ads' | 'scan' | 'upload' | 'quota' | 'auth' | 'db' | 'general';

interface LogEntry {
  level: LogLevel;
  category: LogCategory;
  message: string;
  metadata?: Record<string, any>;
  timestamp: Date;
}

class CloudLogger {
  private logQueue: LogEntry[] = [];
  private flushInterval: ReturnType<typeof setInterval> | null = null;
  private sessionId: string;
  private deviceInfo: Record<string, any>;
  private enabled: boolean = true;
  
  // Configure which categories/levels to send to cloud
  private enabledCategories: Set<LogCategory> = new Set(['ads', 'scan', 'upload', 'quota']);
  private minLevel: LogLevel = 'info'; // Only send info, warn, error (not debug)

  constructor() {
    // Generate session ID
    this.sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Capture device info once
    this.deviceInfo = {
      platform: Platform.OS,
      platformVersion: Platform.Version,
      appVersion: Constants.expoConfig?.version || 'unknown',
      deviceName: Constants.deviceName,
      isDevice: Constants.isDevice,
    };

    // Start flush interval (every 5 seconds)
    this.startFlushInterval();
  }

  private startFlushInterval() {
    if (this.flushInterval) return;
    
    this.flushInterval = setInterval(() => {
      this.flush();
    }, 5000); // Flush every 5 seconds
  }

  private stopFlushInterval() {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
  }

  private shouldLog(category: LogCategory, level: LogLevel): boolean {
    if (!this.enabled) return false;
    if (!this.enabledCategories.has(category)) return false;
    
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    const minLevelIndex = levels.indexOf(this.minLevel);
    const currentLevelIndex = levels.indexOf(level);
    
    return currentLevelIndex >= minLevelIndex;
  }

  private addToQueue(entry: LogEntry) {
    this.logQueue.push(entry);
    
    // If queue is getting large, flush immediately
    if (this.logQueue.length >= 20) {
      this.flush();
    }
  }

  async flush() {
    if (this.logQueue.length === 0) return;
    if (!supabase) {
      return;
    }
    
    const logsToSend = [...this.logQueue];
    this.logQueue = [];

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const formattedLogs = logsToSend.map(log => ({
        user_id: user?.id || null,
        level: log.level,
        category: log.category,
        message: log.message,
        metadata: log.metadata || null,
        device_info: this.deviceInfo,
        session_id: this.sessionId,
        created_at: log.timestamp.toISOString(),
      }));

      const { error } = await supabase
        .from('app_logs')
        .insert(formattedLogs);

      if (error) {
        console.warn('[CloudLogger] Failed to send logs:', error.message);
      }
    } catch (err) {
      console.warn('[CloudLogger] Error flushing logs:', err);
    }
  }

  debug(category: LogCategory, message: string, metadata?: Record<string, any>) {
    if (!this.shouldLog(category, 'debug')) return;
    console.log(`[${category.toUpperCase()}] ${message}`, metadata || '');
    this.addToQueue({ level: 'debug', category, message, metadata, timestamp: new Date() });
  }

  info(category: LogCategory, message: string, metadata?: Record<string, any>) {
    if (!this.shouldLog(category, 'info')) return;
    console.log(`[${category.toUpperCase()}] ${message}`, metadata || '');
    this.addToQueue({ level: 'info', category, message, metadata, timestamp: new Date() });
  }

  warn(category: LogCategory, message: string, metadata?: Record<string, any>) {
    if (!this.shouldLog(category, 'warn')) return;
    console.warn(`[${category.toUpperCase()}] ${message}`, metadata || '');
    this.addToQueue({ level: 'warn', category, message, metadata, timestamp: new Date() });
  }

  error(category: LogCategory, message: string, metadata?: Record<string, any>) {
    if (!this.shouldLog(category, 'error')) return;
    console.error(`[${category.toUpperCase()}] ${message}`, metadata || '');
    this.addToQueue({ level: 'error', category, message, metadata, timestamp: new Date() });
  }
}

// Export singleton instance
export const cloudLog = new CloudLogger();
