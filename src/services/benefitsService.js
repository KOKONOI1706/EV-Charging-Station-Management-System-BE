import { supabaseAdmin } from '../config/supabase.js';

/**
 * Apply package benefits to user
 * @param {number} user_id - User ID
 * @param {number} package_id - Package ID
 * @param {object} benefits - Package benefits object
 * @returns {Promise<object>} - Applied benefits result
 */
export const applyPackageBenefits = async (user_id, package_id, benefits) => {
  try {
    console.log(`🎁 Applying benefits for user ${user_id}, package ${package_id}`);
    console.log('📦 Benefits:', JSON.stringify(benefits, null, 2));

    const appliedBenefits = [];

    // 1. Apply discount rate (if exists)
    if (benefits.discount_rate && benefits.discount_rate > 0) {
      console.log(`💰 Applying ${benefits.discount_rate}% discount rate`);
      
      // Update user's discount rate in a user_settings table or directly in users table
      // For now, we'll log it - you can extend this to update a user_settings table
      appliedBenefits.push({
        type: 'discount_rate',
        value: benefits.discount_rate,
        description: `${benefits.discount_rate}% giảm giá cho mọi phiên sạc`
      });
    }

    // 2. Apply bonus minutes (if exists)
    if (benefits.bonus_minutes && benefits.bonus_minutes > 0) {
      console.log(`⏰ Granting ${benefits.bonus_minutes} bonus minutes`);
      
      appliedBenefits.push({
        type: 'bonus_minutes',
        value: benefits.bonus_minutes,
        description: `${benefits.bonus_minutes} phút miễn phí idle fee`
      });
    }

    // 3. Apply reward points (if exists)
    if (benefits.reward_points && benefits.reward_points > 0) {
      console.log(`⭐ Granting ${benefits.reward_points} reward points`);
      
      // Update user's points balance
      // This would typically update a user_points or loyalty_points table
      appliedBenefits.push({
        type: 'reward_points',
        value: benefits.reward_points,
        description: `${benefits.reward_points} điểm thưởng`
      });
    }

    // 4. Enable priority support
    if (benefits.priority_support === true) {
      console.log('🎯 Enabling priority support');
      
      appliedBenefits.push({
        type: 'priority_support',
        value: true,
        description: 'Hỗ trợ khách hàng ưu tiên'
      });
    }

    // 5. Enable 24/7 support
    if (benefits.support_24_7 === true) {
      console.log('📞 Enabling 24/7 support');
      
      appliedBenefits.push({
        type: 'support_24_7',
        value: true,
        description: 'Hỗ trợ 24/7'
      });
    }

    // 6. Enable booking priority
    if (benefits.booking_priority === true) {
      console.log('📅 Enabling booking priority');
      
      appliedBenefits.push({
        type: 'booking_priority',
        value: true,
        description: 'Ưu tiên đặt chỗ sạc'
      });
    }

    // 7. Enable free start fee
    if (benefits.free_start_fee === true) {
      console.log('🎉 Enabling free start fee');
      
      appliedBenefits.push({
        type: 'free_start_fee',
        value: true,
        description: 'Miễn phí khởi động phiên sạc'
      });
    }

    // 8. Enable energy tracking
    if (benefits.energy_tracking === true) {
      console.log('📊 Enabling energy tracking');
      
      appliedBenefits.push({
        type: 'energy_tracking',
        value: true,
        description: 'Theo dõi năng lượng chi tiết'
      });
    }

    // 9. Max sessions limit
    if (benefits.max_sessions && benefits.max_sessions > 0) {
      console.log(`🔢 Setting max sessions: ${benefits.max_sessions}`);
      
      appliedBenefits.push({
        type: 'max_sessions',
        value: benefits.max_sessions,
        description: `Tối đa ${benefits.max_sessions} phiên sạc/tháng`
      });
    }

    // 10. After limit discount
    if (benefits.after_limit_discount === true) {
      console.log('💵 Enabling after-limit discount');
      
      appliedBenefits.push({
        type: 'after_limit_discount',
        value: true,
        description: 'Giảm giá sau khi vượt giới hạn'
      });
    }

    // Store applied benefits in user_packages record for reference
    const { error: updateError } = await supabaseAdmin
      .from('user_packages')
      .update({
        applied_benefits: appliedBenefits,
        benefits_applied_at: new Date().toISOString()
      })
      .eq('user_id', user_id)
      .eq('package_id', package_id)
      .eq('status', 'active');

    if (updateError) {
      console.warn('⚠️ Failed to update applied_benefits in user_packages:', updateError.message);
    }

    console.log(`✅ Successfully applied ${appliedBenefits.length} benefits for user ${user_id}`);
    
    return {
      success: true,
      applied_benefits: appliedBenefits,
      total_benefits: appliedBenefits.length
    };

  } catch (error) {
    console.error('❌ Error applying package benefits:', error);
    throw error;
  }
};

/**
 * Get active benefits for a user
 * @param {number} user_id - User ID
 * @returns {Promise<object>} - Active benefits
 */
export const getActiveBenefits = async (user_id) => {
  try {
    // Get all active packages for user
    const { data: activePackages, error } = await supabaseAdmin
      .from('user_packages')
      .select(`
        *,
        service_packages (
          name,
          benefits
        )
      `)
      .eq('user_id', user_id)
      .eq('status', 'active')
      .gte('end_date', new Date().toISOString());

    if (error) throw error;

    if (!activePackages || activePackages.length === 0) {
      return {
        has_active_package: false,
        benefits: []
      };
    }

    // Aggregate all benefits from active packages
    const allBenefits = [];
    let maxDiscountRate = 0;
    let totalBonusMinutes = 0;
    let totalRewardPoints = 0;
    let maxSessions = 0;
    let hasPrioritySupport = false;
    let hasSupport247 = false;
    let hasBookingPriority = false;
    let hasFreeStartFee = false;
    let hasEnergyTracking = false;
    let hasAfterLimitDiscount = false;

    for (const pkg of activePackages) {
      const benefits = pkg.service_packages.benefits;
      
      if (benefits.discount_rate > maxDiscountRate) {
        maxDiscountRate = benefits.discount_rate;
      }
      
      if (benefits.bonus_minutes) {
        totalBonusMinutes += benefits.bonus_minutes;
      }
      
      if (benefits.reward_points) {
        totalRewardPoints += benefits.reward_points;
      }

      if (benefits.max_sessions > maxSessions) {
        maxSessions = benefits.max_sessions;
      }

      // Boolean benefits (any package has it = user has it)
      if (benefits.priority_support) hasPrioritySupport = true;
      if (benefits.support_24_7) hasSupport247 = true;
      if (benefits.booking_priority) hasBookingPriority = true;
      if (benefits.free_start_fee) hasFreeStartFee = true;
      if (benefits.energy_tracking) hasEnergyTracking = true;
      if (benefits.after_limit_discount) hasAfterLimitDiscount = true;

      if (pkg.applied_benefits) {
        allBenefits.push(...pkg.applied_benefits);
      }
    }

    const firstPackage = activePackages[0];

    return {
      has_active_package: true,
      package_name: firstPackage.service_packages.name,
      package_id: firstPackage.package_id,
      start_date: firstPackage.start_date,
      end_date: firstPackage.end_date,
      total_packages: activePackages.length,
      benefits: allBenefits,
      aggregated: {
        discount_rate: maxDiscountRate,
        bonus_minutes: totalBonusMinutes,
        reward_points: totalRewardPoints,
        max_sessions: maxSessions,
        priority_support: hasPrioritySupport,
        support_24_7: hasSupport247,
        booking_priority: hasBookingPriority,
        free_start_fee: hasFreeStartFee,
        energy_tracking: hasEnergyTracking,
        after_limit_discount: hasAfterLimitDiscount
      }
    };

  } catch (error) {
    console.error('Error getting active benefits:', error);
    throw error;
  }
};

/**
 * Check if user has exceeded max sessions limit
 * @param {number} user_id - User ID
 * @returns {Promise<object>} - Session usage info
 */
export const checkSessionLimit = async (user_id) => {
  try {
    // Get active packages for user
    const { data: activePackages, error } = await supabaseAdmin
      .from('user_packages')
      .select(`
        *,
        service_packages (
          name,
          benefits
        )
      `)
      .eq('user_id', user_id)
      .eq('status', 'active')
      .gte('end_date', new Date().toISOString());

    if (error) throw error;

    if (!activePackages || activePackages.length === 0) {
      return {
        has_active_package: false,
        has_limit: false,
        sessions_used: 0,
        sessions_limit: null,
        sessions_remaining: null,
        limit_exceeded: false
      };
    }

    const pkg = activePackages[0];
    const benefits = pkg.service_packages.benefits;
    const maxSessions = benefits.max_sessions;

    // If no max_sessions limit, return unlimited
    if (!maxSessions || maxSessions === null) {
      return {
        has_active_package: true,
        has_limit: false,
        package_name: pkg.service_packages.name,
        sessions_used: 0,
        sessions_limit: null,
        sessions_remaining: null,
        limit_exceeded: false
      };
    }

    // Count sessions used since package start_date
    const { data: sessions, error: sessionsError } = await supabaseAdmin
      .from('charging_sessions')
      .select('session_id, status, start_time')
      .eq('user_id', user_id)
      .gte('start_time', pkg.start_date)
      .lte('start_time', pkg.end_date || new Date().toISOString())
      .in('status', ['Completed', 'Active']);

    if (sessionsError) {
      console.error('Error counting sessions:', sessionsError);
    }

    const sessionsUsed = sessions ? sessions.length : 0;
    const sessionsRemaining = Math.max(0, maxSessions - sessionsUsed);
    const limitExceeded = sessionsUsed >= maxSessions;

    return {
      has_active_package: true,
      has_limit: true,
      package_name: pkg.service_packages.name,
      start_date: pkg.start_date,
      end_date: pkg.end_date,
      sessions_used: sessionsUsed,
      sessions_limit: maxSessions,
      sessions_remaining: sessionsRemaining,
      limit_exceeded: limitExceeded,
      after_limit_discount: benefits.after_limit_discount || false,
      discount_rate_after_limit: benefits.after_limit_discount ? (benefits.discount_rate / 2) : 0
    };

  } catch (error) {
    console.error('Error checking session limit:', error);
    throw error;
  }
};

/**
 * Calculate discounted price based on user's active benefits
 * @param {number} user_id - User ID
 * @param {number} original_price - Original price
 * @returns {Promise<object>} - Discounted price info
 */
export const calculateDiscountedPrice = async (user_id, original_price) => {
  try {
    const activeBenefits = await getActiveBenefits(user_id);
    
    if (!activeBenefits.has_active_package) {
      return {
        original_price,
        discounted_price: original_price,
        discount_rate: 0,
        savings: 0
      };
    }

    // Check session limit
    const sessionLimit = await checkSessionLimit(user_id);
    
    let discountRate = activeBenefits.aggregated.discount_rate;
    let limitMessage = null;

    // If user exceeded max_sessions
    if (sessionLimit.has_limit && sessionLimit.limit_exceeded) {
      if (sessionLimit.after_limit_discount) {
        // Still get discount but reduced (e.g., 50% of original discount)
        discountRate = sessionLimit.discount_rate_after_limit;
        limitMessage = `Bạn đã vượt giới hạn ${sessionLimit.sessions_limit} phiên/tháng. ` +
                      `Giảm giá còn ${discountRate}% (từ ${activeBenefits.aggregated.discount_rate}%)`;
      } else {
        // No discount after limit
        discountRate = 0;
        limitMessage = `Bạn đã sử dụng hết ${sessionLimit.sessions_limit} phiên trong tháng này. ` +
                      `Giảm giá không còn hiệu lực cho các phiên tiếp theo.`;
      }
    } else if (sessionLimit.has_limit) {
      limitMessage = `Còn ${sessionLimit.sessions_remaining}/${sessionLimit.sessions_limit} phiên có giảm giá`;
    }

    const discount = (original_price * discountRate) / 100;
    const discountedPrice = original_price - discount;

    return {
      original_price,
      discounted_price: Math.round(discountedPrice),
      discount_rate: discountRate,
      savings: Math.round(discount),
      session_limit_info: sessionLimit.has_limit ? {
        sessions_used: sessionLimit.sessions_used,
        sessions_limit: sessionLimit.sessions_limit,
        sessions_remaining: sessionLimit.sessions_remaining,
        limit_exceeded: sessionLimit.limit_exceeded,
        message: limitMessage
      } : null
    };

  } catch (error) {
    console.error('Error calculating discounted price:', error);
    return {
      original_price,
      discounted_price: original_price,
      discount_rate: 0,
      savings: 0
    };
  }
};
