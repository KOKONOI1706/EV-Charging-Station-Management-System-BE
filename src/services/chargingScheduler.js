/**
 * ===============================================================
 * CHARGING SCHEDULER SERVICE (BACKEND)
 * ===============================================================
 * Background service xử lý các tác vụ định kỳ
 * 
 * Chức năng:
 * - ⏰ Auto-expire reservations cũ (mỗi 30s)
 * - 🟡 Detect sessions gần đầy pin → AlmostDone status (mỗi 1 phút)
 * - 🧹 Clean up stale data
 * - 📊 Health check và monitoring
 * 
 * Schedulers:
 * 
 * 1. Reservation Expiry (30 seconds interval)
 *    - Gọi reservationService.expireOldReservations()
 *    - Tìm reservations có expire_time < now
 *    - Cập nhật status = Expired
 *    - Release charging points
 *    - Log số reservations đã expire
 * 
 * 2. AlmostDone Detection (1 minute interval)
 *    - Gọi sessionManagementService.detectAlmostDoneSessions()
 *    - Tìm sessions có battery >= 95%
 *    - Cập nhật charging point status = AlmostDone
 *    - Gửi notification cho user (cảnh báo idle fee)
 *    - Log số points đã update
 * 
 * Lifecycle:
 * - start(): Bắt đầu tất cả schedulers
 * - stop(): Dừng tất cả schedulers
 * - runImmediately(): Chạy 1 lần ngay lập tức (testing)
 * 
 * Usage:
 * ```javascript
 * // In server.js
 * import chargingScheduler from './services/chargingScheduler.js';
 * 
 * // Start when server starts
 * chargingScheduler.start();
 * 
 * // Stop when server shuts down
 * process.on('SIGTERM', () => {
 *   chargingScheduler.stop();
 * });
 * ```
 * 
 * Error handling:
 * - Mỗi scheduler có try-catch riêng
 * - Lỗi không làm crash server
 * - Log errors để monitoring
 * 
 * Dependencies:
 * - reservationService: Expire reservations
 * - sessionManagementService: Detect AlmostDone sessions
 */

import reservationService from './reservationService.js';
import sessionManagementService from './sessionManagementService.js';

/**
 * Charging Scheduler Service
 * Handles periodic tasks:
 * - Expire old reservations
 * - Detect sessions almost done
 * - Clean up stale data
 */

class ChargingScheduler {
  constructor() {
    this.intervals = {
      reservationExpiry: null,
      almostDoneDetection: null
    };
    this.isRunning = false;
  }

  /**
   * Start all schedulers
   */
  start() {
    if (this.isRunning) {
      console.log('⚠️  Scheduler already running');
      return;
    }

    console.log('🚀 Starting charging scheduler...');

    // Reservation expiry - every 30 seconds
    this.intervals.reservationExpiry = setInterval(async () => {
      try {
        const result = await reservationService.expireOldReservations();
        if (result.expired > 0) {
          console.log(`⏱️  Expired ${result.expired} old reservations`);
        }
      } catch (error) {
        console.error('Error in reservation expiry scheduler:', error);
      }
    }, 30 * 1000); // 30 seconds

    // Detect almost done sessions every 1 minute
    this.intervals.almostDoneDetection = setInterval(async () => {
      try {
        const result = await sessionManagementService.detectAlmostDoneSessions();
        if (result.updated > 0) {
          console.log(`🟡 Updated ${result.updated} points to AlmostDone status`);
        }
      } catch (error) {
        console.error('Error in almost done detection:', error);
      }
    }, 60 * 1000); // 1 minute

    this.isRunning = true;
    console.log('✅ Charging scheduler started');
    console.log('   - Reservation expiry: every 30s');
    console.log('   - AlmostDone detection: every 1min');

    // Run immediately on start
    this.runImmediately();
  }

  /**
   * Stop all schedulers
   */
  stop() {
    if (!this.isRunning) {
      console.log('⚠️  Scheduler not running');
      return;
    }

    console.log('🛑 Stopping charging scheduler...');

    if (this.intervals.reservationExpiry) {
      clearInterval(this.intervals.reservationExpiry);
      this.intervals.reservationExpiry = null;
    }

    if (this.intervals.almostDoneDetection) {
      clearInterval(this.intervals.almostDoneDetection);
      this.intervals.almostDoneDetection = null;
    }

    this.isRunning = false;
    console.log('✅ Charging scheduler stopped');
  }

  /**
   * Run all tasks immediately (for testing or on startup)
   */
  async runImmediately() {
    console.log('🔄 Running scheduler tasks immediately...');
    
    try {
      // Expire old reservations
      const expiryResult = await reservationService.expireOldReservations();
      console.log(`   ✓ Expired ${expiryResult.expired} reservations`);

      // Detect almost done sessions
      const almostDoneResult = await sessionManagementService.detectAlmostDoneSessions();
      console.log(`   ✓ Detected ${almostDoneResult.updated || 0} almost done sessions`);

      console.log('✅ Initial scheduler run complete');
    } catch (error) {
      console.error('Error in initial scheduler run:', error);
    }
  }

  /**
   * Get scheduler status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      intervals: {
        reservationExpiry: this.intervals.reservationExpiry ? 'Active (30s)' : 'Inactive',
        almostDoneDetection: this.intervals.almostDoneDetection ? 'Active (1min)' : 'Inactive'
      }
    };
  }
}

export default new ChargingScheduler();
