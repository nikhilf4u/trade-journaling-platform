package com.tradejournal.tradeservice.service;

import com.tradejournal.tradeservice.entity.Trade;
import com.tradejournal.tradeservice.entity.TradeScreenshot;
import com.tradejournal.tradeservice.event.TradeEventPublisher;
import com.tradejournal.tradeservice.repository.TradeRepository;
import com.tradejournal.tradeservice.repository.TradeScreenshotRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class TradeService {

    private final TradeRepository tradeRepository;
    private final TradeScreenshotRepository screenshotRepository;
    private final TradeEventPublisher eventPublisher;

    @Value("${upload.dir:./uploads}")
    private String uploadDir;

    @Transactional
    public Trade createTrade(Trade trade) {
        if (trade.getExitPrice() == null) {
            throw new IllegalArgumentException("Exit price is required");
        }
        trade.setPnl(null);
        Trade savedTrade = tradeRepository.save(trade);
        eventPublisher.publishTradeLoggedEvent(savedTrade);
        log.info("✅ Trade created with ID: {}", savedTrade.getId());
        return savedTrade;
    }

    public List<Trade> getTradesForUser(Long userId) {
        return tradeRepository.findByUserIdOrderByEntryDateDesc(userId);
    }

    public List<Trade> getTradesForUserAndMarket(Long userId, String market) {
        return tradeRepository.findByUserIdAndMarketOrderByEntryDateDesc(userId, market);
    }

    public Trade getTradeById(Long id) {
        return tradeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Trade not found with ID: " + id));
    }

    @Transactional
    public Trade updateTrade(Long id, Trade updatedTrade) {
        Trade existing = getTradeById(id);

        // Identity fields — editable because traders correct typos
        existing.setMarket(updatedTrade.getMarket());
        existing.setSymbol(updatedTrade.getSymbol());
        existing.setInstrumentType(updatedTrade.getInstrumentType());
        existing.setDirection(updatedTrade.getDirection());

        // Trade metrics
        existing.setEntryPrice(updatedTrade.getEntryPrice());
        existing.setExitPrice(updatedTrade.getExitPrice());
        existing.setQuantity(updatedTrade.getQuantity());
        existing.setEntryDate(updatedTrade.getEntryDate());
        existing.setExitDate(updatedTrade.getExitDate());

        // Planning fields
        existing.setStoploss(updatedTrade.getStoploss());
        existing.setTarget(updatedTrade.getTarget());
        existing.setLongTimeFrameBias(updatedTrade.getLongTimeFrameBias());

        // Notes
        existing.setNotes(updatedTrade.getNotes());

        // pnl is auto-recalculated by PostgreSQL
        Trade saved = tradeRepository.save(existing);
        log.info("✏️ Trade updated with ID: {}", saved.getId());
        return saved;
    }

    @Transactional
    public void deleteTrade(Long tradeId, Long userId) {
        Trade trade = getTradeById(tradeId);
        if (!trade.getUserId().equals(userId)) {
            throw new RuntimeException("You do not own this trade");
        }

        // Delete physical files from disk
        for (TradeScreenshot s : trade.getScreenshots()) {
            deletePhysicalFile(s.getUrl());
        }

        // Delete screenshot rows via cascade/orphanRemoval
        trade.getScreenshots().clear();
        tradeRepository.save(trade);

        tradeRepository.delete(trade);
        log.info("🗑️ Trade deleted with ID: {}", tradeId);
    }

    // ========== SCREENSHOT MANAGEMENT ==========

    @Transactional
    public TradeScreenshot addScreenshot(Long tradeId, String url, String label) {
        Trade trade = getTradeById(tradeId);
        TradeScreenshot screenshot = TradeScreenshot.builder()
                .trade(trade)
                .url(url)
                .label(label)
                .build();
        TradeScreenshot saved = screenshotRepository.save(screenshot);
        log.info("📸 Screenshot added with ID: {} to trade {}", saved.getId(), tradeId);
        return saved;
    }

    /**
     * ⭐ FIXED: Remove from parent's collection (triggers orphanRemoval)
     * AND delete the physical file from disk.
     */
    @Transactional
    public void deleteScreenshot(Long tradeId, Long screenshotId) {
        Trade trade = getTradeById(tradeId);

        // Find the screenshot in the parent's collection
        TradeScreenshot screenshotToDelete = trade.getScreenshots().stream()
                .filter(s -> s.getId().equals(screenshotId))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Screenshot not found"));

        // ⭐ Delete physical file from disk
        deletePhysicalFile(screenshotToDelete.getUrl());

        // ⭐ Remove from the parent's collection — this triggers orphanRemoval
        trade.getScreenshots().remove(screenshotToDelete);

        // Save parent — Hibernate will issue DELETE for the orphaned child
        tradeRepository.save(trade);

        log.info("🗑️ Screenshot ID {} removed from trade {}", screenshotId, tradeId);
    }

    public List<TradeScreenshot> getScreenshots(Long tradeId) {
        return screenshotRepository.findByTradeId(tradeId);
    }

    /**
     * Helper: Delete a physical file from disk based on its URL.
     * URL looks like: http://localhost:8082/uploads/trade_3_abc.png
     * We extract the filename and delete from the upload directory.
     */
    private void deletePhysicalFile(String url) {
        if (url == null || url.isEmpty()) return;
        try {
            String filename = url.substring(url.lastIndexOf("/") + 1);
            Path filePath = Paths.get(uploadDir).toAbsolutePath().normalize().resolve(filename);
            boolean deleted = Files.deleteIfExists(filePath);
            if (deleted) {
                log.info("🗑️ Deleted physical file: {}", filePath);
            } else {
                log.warn("⚠️ File not found on disk: {}", filePath);
            }
        } catch (IOException e) {
            log.error("❌ Failed to delete physical file: {}", url, e);
        }
    }
}