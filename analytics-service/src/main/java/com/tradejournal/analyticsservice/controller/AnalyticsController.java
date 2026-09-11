package com.tradejournal.analyticsservice.controller;

import com.tradejournal.analyticsservice.service.AnalyticsService;
import com.tradejournal.commonlibrary.dto.ApiResponse;
import com.tradejournal.commonlibrary.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
@Slf4j
public class AnalyticsController {

    private final AnalyticsService analyticsService;
    private final JwtUtil jwtUtil;

    private Long getUserIdFromHeader(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new RuntimeException("Missing or invalid Authorization header");
        }
        return jwtUtil.extractUserId(authHeader);
    }

    // ================================================================
    // 🎯 FULL DASHBOARD — one call gets everything
    // ================================================================
    @GetMapping("/dashboard")
    public ResponseEntity<?> getDashboard(
            @RequestHeader("Authorization") String authHeader) {

        Long userId = getUserIdFromHeader(authHeader);
        log.info("📊 Dashboard request for user {}", userId);
        return ResponseEntity.ok(
                ApiResponse.success(analyticsService.getDashboard(userId)));
    }

    // ================================================================
    // 📊 SUMMARY STATS — Accuracy, R:R, Profit Factor, Expectancy
    // ================================================================
    @GetMapping("/summary")
    public ResponseEntity<?> getSummary(
            @RequestHeader("Authorization") String authHeader) {

        Long userId = getUserIdFromHeader(authHeader);
        return ResponseEntity.ok(
                ApiResponse.success(analyticsService.getSummaryStats(userId)));
    }

    // ================================================================
    // 📈 EQUITY CURVE
    // ================================================================
    @GetMapping("/equity-curve")
    public ResponseEntity<?> getEquityCurve(
            @RequestHeader("Authorization") String authHeader) {

        Long userId = getUserIdFromHeader(authHeader);
        return ResponseEntity.ok(
                ApiResponse.success(analyticsService.getEquityCurve(userId)));
    }

    // ================================================================
    // 📊 MONTHLY P&L
    // ================================================================
    @GetMapping("/monthly")
    public ResponseEntity<?> getMonthly(
            @RequestHeader("Authorization") String authHeader) {

        Long userId = getUserIdFromHeader(authHeader);
        return ResponseEntity.ok(
                ApiResponse.success(analyticsService.getMonthlyPnl(userId)));
    }

    // ================================================================
    // 🌍 MARKET PERFORMANCE
    // ================================================================
    @GetMapping("/market-performance")
    public ResponseEntity<?> getMarketPerformance(
            @RequestHeader("Authorization") String authHeader) {

        Long userId = getUserIdFromHeader(authHeader);
        return ResponseEntity.ok(
                ApiResponse.success(analyticsService.getMarketPerformance(userId)));
    }

    // ================================================================
    // 🎯 BIAS PERFORMANCE
    // ================================================================
    @GetMapping("/bias-performance")
    public ResponseEntity<?> getBiasPerformance(
            @RequestHeader("Authorization") String authHeader) {

        Long userId = getUserIdFromHeader(authHeader);
        return ResponseEntity.ok(
                ApiResponse.success(analyticsService.getBiasPerformance(userId)));
    }

    // ================================================================
    // 📉 MAX DRAWDOWN
    // ================================================================
    @GetMapping("/max-drawdown")
    public ResponseEntity<?> getMaxDrawdown(
            @RequestHeader("Authorization") String authHeader) {

        Long userId = getUserIdFromHeader(authHeader);
        return ResponseEntity.ok(
                ApiResponse.success(analyticsService.getMaxDrawdown(userId)));
    }

    // ================================================================
    // 🛑 STOP LOSS ADHERENCE
    // ================================================================
    @GetMapping("/stop-loss-adherence")
    public ResponseEntity<?> getStopLossAdherence(
            @RequestHeader("Authorization") String authHeader) {

        Long userId = getUserIdFromHeader(authHeader);
        return ResponseEntity.ok(
                ApiResponse.success(analyticsService.getStopLossAdherence(userId)));
    }
}