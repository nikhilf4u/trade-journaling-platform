package com.tradejournal.analyticsservice.consumer;

import com.tradejournal.analyticsservice.service.AnalyticsService;
import com.tradejournal.commonlibrary.event.TradeLoggedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class TradeEventConsumer {

    private final AnalyticsService analyticsService;

    /**
     * Listens to the `trade-events` Kafka topic.
     * Every time a trade is created/updated/deleted in the Trade Service,
     * this consumer receives the event and invalidates the user's analytics cache.
     *
     * We do NOT recalculate here — we just invalidate.
     * The next API request triggers a fresh calculation that gets cached.
     * This is the classic Cache-Aside pattern.
     */
    @KafkaListener(
            topics = "trade-events",
            groupId = "analytics-group",
            containerFactory = "kafkaListenerContainerFactory"
    )
    public void consumeTradeEvent(TradeLoggedEvent event) {
        log.info("📥 Received TradeLoggedEvent: tradeId={}, userId={}, symbol={}, pnl={}",
                event.getTradeId(),
                event.getUserId(),
                event.getSymbol(),
                event.getPnl());

        try {
            // Invalidate the analytics cache for this user
            analyticsService.invalidateUserCache(event.getUserId());

            log.info("✅ Analytics cache invalidated for user {}", event.getUserId());
        } catch (Exception e) {
            log.error("❌ Failed to process trade event for user {}: {}",
                    event.getUserId(), e.getMessage(), e);
        }
    }
}