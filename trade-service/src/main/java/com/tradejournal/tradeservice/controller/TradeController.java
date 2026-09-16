package com.tradejournal.tradeservice.controller;

import com.tradejournal.commonlibrary.dto.ApiResponse;
import com.tradejournal.commonlibrary.security.JwtUtil;
import com.tradejournal.tradeservice.entity.Trade;
import com.tradejournal.tradeservice.service.TradeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/trades")
@RequiredArgsConstructor
@Slf4j
public class TradeController {

    private final TradeService tradeService;
    private final JwtUtil jwtUtil;

    private Long getUserIdFromHeader(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new RuntimeException("Missing or invalid Authorization header");
        }
        return jwtUtil.extractUserId(authHeader);
    }

    // ==================== CREATE ====================
    @PostMapping
    public ResponseEntity<?> createTrade(
            @RequestHeader("Authorization") String authHeader,
            @Valid @RequestBody Trade trade) {

        Long userId = getUserIdFromHeader(authHeader);
        trade.setUserId(userId);
        Trade saved = tradeService.createTrade(trade);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(saved, "Trade created successfully"));
    }

    // ==================== LIST ====================
    @GetMapping
    public ResponseEntity<?> getTrades(
            @RequestHeader("Authorization") String authHeader,
            @RequestParam(required = false) String market,
            @RequestParam(required = false) String type) {  // ⭐ NEW: "taken" | "missed" | null

        Long userId = getUserIdFromHeader(authHeader);
        List<Trade> trades;

        if ("missed".equalsIgnoreCase(type)) {
            trades = (market != null && !market.isEmpty())
                    ? tradeService.getMissedTradesByMarket(userId, market)
                    : tradeService.getMissedTrades(userId);
        } else if ("taken".equalsIgnoreCase(type)) {
            trades = (market != null && !market.isEmpty())
                    ? tradeService.getTakenTradesByMarket(userId, market)
                    : tradeService.getTakenTrades(userId);
        } else {
            // Default: all trades
            trades = (market != null && !market.isEmpty())
                    ? tradeService.getTradesForUserAndMarket(userId, market)
                    : tradeService.getTradesForUser(userId);
        }

        return ResponseEntity.ok(ApiResponse.success(trades));
    }

    // ==================== GET SINGLE ====================
    @GetMapping("/{id}")
    public ResponseEntity<?> getTradeById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(tradeService.getTradeById(id)));
    }

    // ==================== UPDATE ⭐ ====================
    @PutMapping("/{id}")
    public ResponseEntity<?> updateTrade(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable Long id,
            @Valid @RequestBody Trade trade) {

        Long userId = getUserIdFromHeader(authHeader);

        // Security: verify ownership
        Trade existing = tradeService.getTradeById(id);
        if (!existing.getUserId().equals(userId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error("You do not own this trade"));
        }

        Trade updated = tradeService.updateTrade(id, trade);
        return ResponseEntity.ok(
                ApiResponse.success(updated, "Trade updated successfully"));
    }

    // ==================== DELETE ⭐ ====================
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteTrade(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable Long id) {

        Long userId = getUserIdFromHeader(authHeader);

        // Security: verify ownership
        Trade existing = tradeService.getTradeById(id);
        if (!existing.getUserId().equals(userId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error("You do not own this trade"));
        }

        tradeService.deleteTrade(id, userId);
        return ResponseEntity.ok(
                ApiResponse.success(null, "Trade deleted successfully"));
    }
}