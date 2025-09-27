import { Order, CreateOrder, UpdateOrder, OrderStatus } from '@/lib/validation/order';
import { BusinessRuleResult } from './types';

export class OrderBusinessRules {
  /**
   * Validate order creation
   */
  static async validateOrderCreation(order: CreateOrder): Promise<BusinessRuleResult> {
    try {
      // Check if customer exists and is active
      const customerValidation = await this.validateCustomer(order.customerId, order.tenantId);
      if (!customerValidation.success) {
        return customerValidation;
      }

      // Validate inventory availability
      const inventoryValidation = await this.validateInventory(order.items, order.tenantId);
      if (!inventoryValidation.success) {
        return inventoryValidation;
      }

      // Validate pricing calculations
      const pricingValidation = this.validatePricing(order);
      if (!pricingValidation.success) {
        return pricingValidation;
      }

      // Validate shipping address
      const addressValidation = this.validateShippingAddress(order.shippingAddress);
      if (!addressValidation.success) {
        return addressValidation;
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: 'Order validation failed',
        code: 'ORDER_VALIDATION_ERROR',
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      };
    }
  }

  /**
   * Validate order update
   */
  static async validateOrderUpdate(
    orderId: string, 
    updates: UpdateOrder, 
    currentOrder: Order
  ): Promise<BusinessRuleResult> {
    try {
      // Check if order can be modified
      const modificationValidation = this.validateOrderModification(currentOrder, updates);
      if (!modificationValidation.success) {
        return modificationValidation;
      }

      // If status is being changed, validate status transition
      if (updates.status && updates.status !== currentOrder.status) {
        const statusValidation = this.validateStatusTransition(currentOrder.status, updates.status);
        if (!statusValidation.success) {
          return statusValidation;
        }
      }

      // If items are being modified, validate inventory
      if (updates.items) {
        const inventoryValidation = await this.validateInventory(updates.items, currentOrder.tenantId);
        if (!inventoryValidation.success) {
          return inventoryValidation;
        }
      }

      // If pricing is being updated, validate calculations
      if (updates.subtotal || updates.total || updates.taxAmount || updates.shippingCost) {
        const pricingValidation = this.validatePricing({ ...currentOrder, ...updates });
        if (!pricingValidation.success) {
          return pricingValidation;
        }
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: 'Order update validation failed',
        code: 'ORDER_UPDATE_VALIDATION_ERROR',
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      };
    }
  }

  /**
   * Validate customer exists and is active
   */
  private static async validateCustomer(customerId: string, tenantId: string): Promise<BusinessRuleResult> {
    try {
      // TODO: Implement actual customer validation
      // For now, just check if customerId is provided
      if (!customerId || !tenantId) {
        return {
          success: false,
          error: 'Customer ID and Tenant ID are required',
          code: 'INVALID_CUSTOMER',
          details: { customerId, tenantId }
        };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: 'Customer validation failed',
        code: 'CUSTOMER_VALIDATION_ERROR',
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      };
    }
  }

  /**
   * Validate inventory availability
   */
  private static async validateInventory(items: any[], tenantId: string): Promise<BusinessRuleResult> {
    try {
      for (const item of items) {
        // TODO: Implement actual inventory validation
        // For now, just check if item has required fields
        if (!item.productId || !item.quantity || item.quantity <= 0) {
          return {
            success: false,
            error: 'Invalid item data',
            code: 'INVALID_ITEM',
            details: { item }
          };
        }

        // TODO: Check actual stock availability
        // const stock = await getProductStock(item.productId, tenantId);
        // if (stock < item.quantity) {
        //   return {
        //     success: false,
        //     error: `Insufficient stock for product ${item.name}`,
        //     code: 'INSUFFICIENT_STOCK',
        //     details: { productId: item.productId, requested: item.quantity, available: stock }
        //   };
        // }
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: 'Inventory validation failed',
        code: 'INVENTORY_VALIDATION_ERROR',
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      };
    }
  }

  /**
   * Validate pricing calculations
   */
  private static validatePricing(order: CreateOrder | (Order & UpdateOrder)): BusinessRuleResult {
    try {
      const { items, subtotal, taxAmount, shippingCost, discountAmount, total } = order;

      // Calculate expected subtotal
      const expectedSubtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

      // Validate subtotal
      if (Math.abs(subtotal - expectedSubtotal) > 0.01) {
        return {
          success: false,
          error: 'Subtotal calculation mismatch',
          code: 'PRICING_ERROR',
          details: { 
            expected: expectedSubtotal, 
            provided: subtotal,
            items: items.map(item => ({ 
              name: item.name, 
              price: item.price, 
              quantity: item.quantity, 
              total: item.price * item.quantity 
            }))
          }
        };
      }

      // Calculate expected total
      const expectedTotal = subtotal + taxAmount + shippingCost - discountAmount;

      // Validate total
      if (Math.abs(total - expectedTotal) > 0.01) {
        return {
          success: false,
          error: 'Total calculation mismatch',
          code: 'PRICING_ERROR',
          details: { 
            expected: expectedTotal, 
            provided: total,
            breakdown: { subtotal, taxAmount, shippingCost, discountAmount }
          }
        };
      }

      // Validate non-negative values
      if (subtotal < 0 || taxAmount < 0 || shippingCost < 0 || discountAmount < 0 || total < 0) {
        return {
          success: false,
          error: 'Pricing values must be non-negative',
          code: 'NEGATIVE_PRICING',
          details: { subtotal, taxAmount, shippingCost, discountAmount, total }
        };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: 'Pricing validation failed',
        code: 'PRICING_VALIDATION_ERROR',
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      };
    }
  }

  /**
   * Validate shipping address
   */
  private static validateShippingAddress(address: any): BusinessRuleResult {
    try {
      const requiredFields = ['firstName', 'lastName', 'address1', 'city', 'state', 'postalCode', 'country'];
      
      for (const field of requiredFields) {
        if (!address[field] || address[field].trim() === '') {
          return {
            success: false,
            error: `Missing required field: ${field}`,
            code: 'INVALID_ADDRESS',
            details: { field, address }
          };
        }
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: 'Address validation failed',
        code: 'ADDRESS_VALIDATION_ERROR',
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      };
    }
  }

  /**
   * Validate if order can be modified
   */
  private static validateOrderModification(currentOrder: Order, updates: UpdateOrder): BusinessRuleResult {
    try {
      // Orders that are delivered, cancelled, or refunded cannot be modified
      const immutableStatuses: OrderStatus[] = ['delivered', 'cancelled', 'refunded'];
      
      if (immutableStatuses.includes(currentOrder.status)) {
        return {
          success: false,
          error: `Cannot modify order with status: ${currentOrder.status}`,
          code: 'IMMUTABLE_ORDER',
          details: { currentStatus: currentOrder.status, immutableStatuses }
        };
      }

      // If order is shipped, only certain fields can be modified
      if (currentOrder.status === 'shipped') {
        const allowedFields = ['status', 'shipping.trackingNumber', 'shipping.carrier', 'notes', 'internalNotes'];
        const modifiedFields = Object.keys(updates);
        
        const disallowedFields = modifiedFields.filter(field => 
          !allowedFields.some(allowed => field.startsWith(allowed))
        );

        if (disallowedFields.length > 0) {
          return {
            success: false,
            error: 'Cannot modify certain fields for shipped orders',
            code: 'RESTRICTED_MODIFICATION',
            details: { 
              disallowedFields, 
              allowedFields,
              currentStatus: currentOrder.status 
            }
          };
        }
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: 'Order modification validation failed',
        code: 'MODIFICATION_VALIDATION_ERROR',
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      };
    }
  }

  /**
   * Validate status transition
   */
  private static validateStatusTransition(fromStatus: OrderStatus, toStatus: OrderStatus): BusinessRuleResult {
    try {
      const validTransitions: Record<OrderStatus, OrderStatus[]> = {
        pending: ['paid', 'cancelled'],
        paid: ['processing', 'cancelled', 'refunded'],
        processing: ['shipped', 'cancelled'],
        shipped: ['delivered', 'cancelled'],
        delivered: ['refunded'],
        cancelled: [], // Cannot transition from cancelled
        refunded: [] // Cannot transition from refunded
      };

      const allowedTransitions = validTransitions[fromStatus];
      
      if (!allowedTransitions.includes(toStatus)) {
        return {
          success: false,
          error: `Invalid status transition from ${fromStatus} to ${toStatus}`,
          code: 'INVALID_STATUS_TRANSITION',
          details: { 
            fromStatus, 
            toStatus, 
            allowedTransitions 
          }
        };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: 'Status transition validation failed',
        code: 'STATUS_TRANSITION_ERROR',
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      };
    }
  }

  /**
   * Generate order number
   */
  static generateOrderNumber(tenantId: string): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    const tenantPrefix = tenantId.substring(0, 3).toUpperCase();
    return `${tenantPrefix}-${timestamp}-${random}`.toUpperCase();
  }

  /**
   * Calculate order totals
   */
  static calculateTotals(items: any[], taxRate: number = 0, shippingCost: number = 0, discountAmount: number = 0) {
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const taxAmount = subtotal * taxRate;
    const total = subtotal + taxAmount + shippingCost - discountAmount;

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      taxAmount: Math.round(taxAmount * 100) / 100,
      shippingCost: Math.round(shippingCost * 100) / 100,
      discountAmount: Math.round(discountAmount * 100) / 100,
      total: Math.round(total * 100) / 100
    };
  }
}

