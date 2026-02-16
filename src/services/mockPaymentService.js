// Mock Payment Service - Simulates payment processing for local testing

export const mockPaymentService = {
    /**
     * Simulates a payment transaction
     * @param {Object} paymentData - Payment details
     * @param {string} paymentData.name - Customer name
     * @param {string} paymentData.email - Customer email
     * @param {string} paymentData.mobile - Customer mobile
     * @param {number} paymentData.amount - Payment amount
     * @param {string} paymentData.eventId - Event ID
     * @param {number} paymentData.numberOfTickets - Number of tickets
     * @returns {Promise<Object>} Payment result
     */
    async processPayment(paymentData) {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Simulate 95% success rate
        const isSuccess = Math.random() > 0.05;

        if (isSuccess) {
            return {
                success: true,
                transactionId: `MOCK_TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
                orderId: `ORD_${Date.now()}`,
                amount: paymentData.amount,
                status: 'SUCCESS',
                message: 'Payment completed successfully (Mock)',
                timestamp: new Date().toISOString()
            };
        } else {
            return {
                success: false,
                status: 'FAILED',
                message: 'Payment failed (Mock simulation)',
                timestamp: new Date().toISOString()
            };
        }
    },

    /**
     * Validates payment status
     * @param {string} transactionId - Transaction ID to validate
     * @returns {Promise<Object>} Validation result
     */
    async validatePayment(transactionId) {
        await new Promise(resolve => setTimeout(resolve, 500));

        return {
            valid: true,
            transactionId,
            status: 'VERIFIED',
            message: 'Payment verified successfully (Mock)'
        };
    }
};
