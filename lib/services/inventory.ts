/**
 * Advanced Inventory Management Service
 * 
 * Handles inventory tracking, low stock alerts, and stock management
 */

import { getTenantDocuments, updateDocument, createDocument } from '@/lib/db';
import { log } from '@/lib/logger';

export interface InventoryAlert {
  id: string;
  tenantId: string;
  productId: string;
  productName: string;
  currentStock: number;
  threshold: number;
  alertType: 'LOW_STOCK' | 'OUT_OF_STOCK' | 'REORDER';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  createdAt: string;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
}

export interface StockMovement {
  id: string;
  tenantId: string;
  productId: string;
  type: 'IN' | 'OUT' | 'ADJUSTMENT' | 'RETURN';
  quantity: number;
  reason: string;
  reference?: string; // Order ID, adjustment reason, etc.
  createdAt: string;
  createdBy?: string;
}

export class InventoryService {
  /**
   * Check for low stock products and create alerts
   */
  static async checkLowStockAlerts(tenantId: string): Promise<InventoryAlert[]> {
    const logger = log.child({ service: 'InventoryService', method: 'checkLowStockAlerts', tenantId });
    
    try {
      const products = await getTenantDocuments('products', tenantId);
      const alerts: InventoryAlert[] = [];
      
      for (const product of products) {
        if (!product.inventory?.trackInventory) continue;
        
        const currentStock = product.stockQuantity || 0;
        const threshold = product.lowStockThreshold || 5;
        
        if (currentStock <= 0) {
          // Out of stock
          alerts.push({
            id: `alert_${Date.now()}_${product.id}`,
            tenantId,
            productId: product.id,
            productName: product.name,
            currentStock,
            threshold,
            alertType: 'OUT_OF_STOCK',
            severity: 'CRITICAL',
            createdAt: new Date().toISOString(),
            acknowledged: false
          });
        } else if (currentStock <= threshold) {
          // Low stock
          alerts.push({
            id: `alert_${Date.now()}_${product.id}`,
            tenantId,
            productId: product.id,
            productName: product.name,
            currentStock,
            threshold,
            alertType: 'LOW_STOCK',
            severity: currentStock <= threshold / 2 ? 'HIGH' : 'MEDIUM',
            createdAt: new Date().toISOString(),
            acknowledged: false
          });
        }
      }
      
      // Save alerts to database
      for (const alert of alerts) {
        await createDocument('inventoryAlerts', alert);
      }
      
      logger.info('Low stock alerts checked', { alertCount: alerts.length });
      return alerts;
    } catch (error) {
      logger.error('Error checking low stock alerts:', error);
      throw error;
    }
  }
  
  /**
   * Record stock movement
   */
  static async recordStockMovement(
    tenantId: string,
    productId: string,
    type: StockMovement['type'],
    quantity: number,
    reason: string,
    reference?: string,
    createdBy?: string
  ): Promise<StockMovement> {
    const logger = log.child({ 
      service: 'InventoryService', 
      method: 'recordStockMovement', 
      tenantId, 
      productId, 
      type, 
      quantity 
    });
    
    try {
      const movement: StockMovement = {
        id: `movement_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        tenantId,
        productId,
        type,
        quantity,
        reason,
        reference,
        createdAt: new Date().toISOString(),
        createdBy
      };
      
      await createDocument('stockMovements', movement);
      
      // Update product stock
      const product = await getTenantDocuments('products', tenantId);
      const currentProduct = product.find((p: any) => p.id === productId);
      
      if (currentProduct && currentProduct.inventory?.trackInventory) {
        let newStock = currentProduct.stockQuantity || 0;
        
        switch (type) {
          case 'IN':
          case 'RETURN':
            newStock += quantity;
            break;
          case 'OUT':
            newStock -= quantity;
            break;
          case 'ADJUSTMENT':
            newStock = quantity; // Direct adjustment
            break;
        }
        
        await updateDocument('products', productId, {
          stockQuantity: Math.max(0, newStock),
          updatedAt: new Date().toISOString()
        }, tenantId);
        
        logger.info('Stock movement recorded and product updated', { 
          productId, 
          oldStock: currentProduct.stockQuantity, 
          newStock 
        });
      }
      
      return movement;
    } catch (error) {
      logger.error('Error recording stock movement:', error);
      throw error;
    }
  }
  
  /**
   * Get inventory alerts for a tenant
   */
  static async getInventoryAlerts(
    tenantId: string, 
    acknowledged?: boolean
  ): Promise<InventoryAlert[]> {
    const logger = log.child({ service: 'InventoryService', method: 'getInventoryAlerts', tenantId });
    
    try {
      const alerts = await getTenantDocuments('inventoryAlerts', tenantId);
      
      let filteredAlerts = alerts;
      if (acknowledged !== undefined) {
        filteredAlerts = alerts.filter((alert: any) => alert.acknowledged === acknowledged);
      }
      
      // Sort by severity and date
      filteredAlerts.sort((a: any, b: any) => {
        const severityOrder = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
        const severityDiff = (severityOrder[b.severity] || 0) - (severityOrder[a.severity] || 0);
        if (severityDiff !== 0) return severityDiff;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
      
      logger.info('Retrieved inventory alerts', { count: filteredAlerts.length });
      return filteredAlerts;
    } catch (error) {
      logger.error('Error getting inventory alerts:', error);
      throw error;
    }
  }
  
  /**
   * Acknowledge an inventory alert
   */
  static async acknowledgeAlert(
    tenantId: string,
    alertId: string,
    acknowledgedBy: string
  ): Promise<void> {
    const logger = log.child({ service: 'InventoryService', method: 'acknowledgeAlert', tenantId, alertId });
    
    try {
      await updateDocument('inventoryAlerts', alertId, {
        acknowledged: true,
        acknowledgedBy,
        acknowledgedAt: new Date().toISOString()
      }, tenantId);
      
      logger.info('Alert acknowledged', { alertId, acknowledgedBy });
    } catch (error) {
      logger.error('Error acknowledging alert:', error);
      throw error;
    }
  }
  
  /**
   * Get stock movements for a product
   */
  static async getStockMovements(
    tenantId: string,
    productId?: string,
    limit: number = 50
  ): Promise<StockMovement[]> {
    const logger = log.child({ service: 'InventoryService', method: 'getStockMovements', tenantId, productId });
    
    try {
      const movements = await getTenantDocuments('stockMovements', tenantId);
      
      let filteredMovements = movements;
      if (productId) {
        filteredMovements = movements.filter((movement: any) => movement.productId === productId);
      }
      
      // Sort by date (newest first) and limit
      filteredMovements.sort((a: any, b: any) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      
      const limitedMovements = filteredMovements.slice(0, limit);
      
      logger.info('Retrieved stock movements', { count: limitedMovements.length });
      return limitedMovements;
    } catch (error) {
      logger.error('Error getting stock movements:', error);
      throw error;
    }
  }
  
  /**
   * Get inventory summary for dashboard
   */
  static async getInventorySummary(tenantId: string): Promise<{
    totalProducts: number;
    lowStockProducts: number;
    outOfStockProducts: number;
    totalValue: number;
    recentMovements: number;
  }> {
    const logger = log.child({ service: 'InventoryService', method: 'getInventorySummary', tenantId });
    
    try {
      const products = await getTenantDocuments('products', tenantId);
      const movements = await getTenantDocuments('stockMovements', tenantId);
      
      const trackedProducts = products.filter((p: any) => p.inventory?.trackInventory);
      const lowStockProducts = trackedProducts.filter((p: any) => 
        p.stockQuantity <= (p.lowStockThreshold || 5) && p.stockQuantity > 0
      );
      const outOfStockProducts = trackedProducts.filter((p: any) => p.stockQuantity <= 0);
      
      const totalValue = trackedProducts.reduce((sum: number, p: any) => 
        sum + ((p.stockQuantity || 0) * (p.price || 0)), 0
      );
      
      const recentMovements = movements.filter((m: any) => {
        const movementDate = new Date(m.createdAt);
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        return movementDate >= weekAgo;
      }).length;
      
      const summary = {
        totalProducts: trackedProducts.length,
        lowStockProducts: lowStockProducts.length,
        outOfStockProducts: outOfStockProducts.length,
        totalValue,
        recentMovements
      };
      
      logger.info('Generated inventory summary', summary);
      return summary;
    } catch (error) {
      logger.error('Error getting inventory summary:', error);
      throw error;
    }
  }
}

