import type { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';

// Função para formatar duração
const formatDuration = (duration: number): string => {
  if (duration < 1000) return `${duration.toFixed(2)}ms`;
  return `${(duration / 1000).toFixed(2)}s`;
};

// Interface para métricas de performance
interface PerformanceMetrics {
  requestId: string;
  method: string;
  url: string;
  startTime: number;
  endTime: number;
  duration: string;
  durationMs: number;
  memoryUsage: {
    before: NodeJS.MemoryUsage;
    after: NodeJS.MemoryUsage;
    delta: {
      rss: string;
      heapUsed: string;
      heapTotal: string;
      external: string;
    };
  };
  cpuUsage?: {
    before: NodeJS.CpuUsage;
    after: NodeJS.CpuUsage;
    delta: {
      user: number;
      system: number;
    };
  };
  statusCode: number;
  responseSize: string;
}

// Função para formatar bytes
const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

// Função para calcular diferença de memória
const calculateMemoryDelta = (before: NodeJS.MemoryUsage, after: NodeJS.MemoryUsage) => {
  return {
    rss: formatBytes(after.rss - before.rss),
    heapUsed: formatBytes(after.heapUsed - before.heapUsed),
    heapTotal: formatBytes(after.heapTotal - before.heapTotal),
    external: formatBytes(after.external - before.external),
  };
};

// Função para calcular diferença de CPU
const calculateCpuDelta = (before: NodeJS.CpuUsage, after: NodeJS.CpuUsage) => {
  return {
    user: after.user - before.user,
    system: after.system - before.system,
  };
};

// Função para obter tamanho da resposta
const getResponseSize = (res: Response): string => {
  const contentLength = res.get('content-length');
  if (contentLength) {
    return formatBytes(parseInt(contentLength));
  }
  return 'unknown';
};

// Thresholds de performance
const PERFORMANCE_THRESHOLDS = {
  SLOW_REQUEST: 1000, // ms
  VERY_SLOW_REQUEST: 5000, // ms
  HIGH_MEMORY_USAGE: 50 * 1024 * 1024, // 50MB
  CRITICAL_MEMORY_USAGE: 100 * 1024 * 1024, // 100MB
};

// Middleware de monitoramento de performance
export const performanceLogger = (req: Request, res: Response, next: NextFunction): void => {
  const requestId = (req as any).requestId || Math.random().toString(36).substring(2, 15);
  const startTime = Date.now();
  
  // Capturar métricas iniciais
  const memoryBefore = process.memoryUsage();
  const cpuBefore = process.cpuUsage();
  
  // Interceptar o final da resposta
  const originalEnd = res.end;
  
  res.end = function(chunk?: any, encoding?: any) {
    // Capturar métricas finais
    const endTime = Date.now();
    const memoryAfter = process.memoryUsage();
    const cpuAfter = process.cpuUsage(cpuBefore);
    
    const durationMs = endTime - startTime;
    const duration = formatDuration(durationMs);
    
    // Calcular deltas
    const memoryDelta = calculateMemoryDelta(memoryBefore, memoryAfter);
    const cpuDelta = calculateCpuDelta(cpuBefore, cpuAfter);
    
    // Montar métricas completas
    const metrics: PerformanceMetrics = {
      requestId,
      method: req.method,
      url: req.originalUrl,
      startTime,
      endTime,
      duration,
      durationMs,
      memoryUsage: {
        before: memoryBefore,
        after: memoryAfter,
        delta: memoryDelta,
      },
      cpuUsage: {
        before: cpuBefore,
        after: cpuAfter,
        delta: cpuDelta,
      },
      statusCode: res.statusCode,
      responseSize: getResponseSize(res),
    };
    
    // Log básico de performance
    logger.performance(`⚡ PERFORMANCE METRICS [${requestId}] - ${req.method} ${req.originalUrl} (${duration}) Status: ${res.statusCode} Memory: ${memoryDelta.heapUsed} Size: ${metrics.responseSize}`);
    
    // Alertas de performance
    if (durationMs > PERFORMANCE_THRESHOLDS.VERY_SLOW_REQUEST) {
      logger.warn(`🐌 VERY SLOW REQUEST [${requestId}] - ${req.method} ${req.originalUrl} (${duration}) Threshold: ${PERFORMANCE_THRESHOLDS.VERY_SLOW_REQUEST}ms Severity: HIGH`);
    } else if (durationMs > PERFORMANCE_THRESHOLDS.SLOW_REQUEST) {
      logger.warn(`🐌 SLOW REQUEST [${requestId}] - ${req.method} ${req.originalUrl} (${duration}) Threshold: ${PERFORMANCE_THRESHOLDS.SLOW_REQUEST}ms Severity: MEDIUM`);
    }
    
    // Alertas de memória
    const memoryDeltaBytes = memoryAfter.heapUsed - memoryBefore.heapUsed;
    if (memoryDeltaBytes > PERFORMANCE_THRESHOLDS.CRITICAL_MEMORY_USAGE) {
      logger.error(`🚨 CRITICAL MEMORY USAGE [${requestId}] - ${req.method} ${req.originalUrl} Increase: ${formatBytes(memoryDeltaBytes)} Current: ${formatBytes(memoryAfter.heapUsed)} Threshold: ${formatBytes(PERFORMANCE_THRESHOLDS.CRITICAL_MEMORY_USAGE)}`);
    } else if (memoryDeltaBytes > PERFORMANCE_THRESHOLDS.HIGH_MEMORY_USAGE) {
      logger.warn(`⚠️  HIGH MEMORY USAGE [${requestId}] - ${req.method} ${req.originalUrl} Increase: ${formatBytes(memoryDeltaBytes)} Current: ${formatBytes(memoryAfter.heapUsed)} Threshold: ${formatBytes(PERFORMANCE_THRESHOLDS.HIGH_MEMORY_USAGE)}`);
    }
    
    // Log detalhado em modo debug
    if (process.env.LOG_LEVEL === 'debug') {
      const detailedInfo = {
        timing: {
          startTime: new Date(startTime).toISOString(),
          endTime: new Date(endTime).toISOString(),
          duration,
          durationMs,
        },
        memory: {
          before: {
            rss: formatBytes(memoryBefore.rss),
            heapUsed: formatBytes(memoryBefore.heapUsed),
            heapTotal: formatBytes(memoryBefore.heapTotal),
            external: formatBytes(memoryBefore.external),
          },
          after: {
            rss: formatBytes(memoryAfter.rss),
            heapUsed: formatBytes(memoryAfter.heapUsed),
            heapTotal: formatBytes(memoryAfter.heapTotal),
            external: formatBytes(memoryAfter.external),
          },
          delta: memoryDelta,
        },
        cpu: {
          delta: {
            user: `${cpuDelta.user}μs`,
            system: `${cpuDelta.system}μs`,
          },
        },
      };
      logger.debug(`🔍 DETAILED PERFORMANCE [${requestId}] - ${JSON.stringify(detailedInfo)}`);
    }
    
    // Chamar o método original
    return originalEnd.call(this, chunk, encoding);
  };
  
  next();
};

// Função para monitorar métricas do sistema
export const logSystemMetrics = (): void => {
  const memory = process.memoryUsage();
  const uptime = process.uptime();
  
  const systemMetrics = {
    memory: {
      rss: formatBytes(memory.rss),
      heapUsed: formatBytes(memory.heapUsed),
      heapTotal: formatBytes(memory.heapTotal),
      external: formatBytes(memory.external),
    },
    uptime: {
      seconds: Math.floor(uptime),
      formatted: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m ${Math.floor(uptime % 60)}s`,
    },
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch,
  };
  
  logger.info(`📊 SYSTEM METRICS - ${JSON.stringify(systemMetrics)}`);
};

// Função para iniciar monitoramento periódico do sistema
export const startSystemMonitoring = (intervalMs: number = 60000): NodeJS.Timeout => {
  logger.info(`🔄 Starting system monitoring - intervalMs: ${intervalMs}`);
  
  return setInterval(() => {
    logSystemMetrics();
  }, intervalMs);
};

// Middleware para detectar vazamentos de memória
export const memoryLeakDetector = (): void => {
  let lastHeapUsed = process.memoryUsage().heapUsed;
  let consecutiveIncreases = 0;
  
  setInterval(() => {
    const currentHeapUsed = process.memoryUsage().heapUsed;
    const increase = currentHeapUsed - lastHeapUsed;
    
    if (increase > 0) {
      consecutiveIncreases++;
      
      if (consecutiveIncreases >= 5) {
        const leakInfo = {
          consecutiveIncreases,
          currentHeapUsed: formatBytes(currentHeapUsed),
          lastHeapUsed: formatBytes(lastHeapUsed),
          increase: formatBytes(increase),
        };
        logger.warn(`🚨 POTENTIAL MEMORY LEAK DETECTED - ${JSON.stringify(leakInfo)}`);
      }
    } else {
      consecutiveIncreases = 0;
    }
    
    lastHeapUsed = currentHeapUsed;
  }, 30000); // Check every 30 seconds
};

export default performanceLogger;