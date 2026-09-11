package com.tradejournal.tradeservice.event;

import com.tradejournal.commonlibrary.event.TradeLoggedEvent;
import com.tradejournal.tradeservice.entity.Trade;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class TradeEventPublisher {

    private final KafkaTemplate<String, Object> kafkaTemplate;
    private static final String TOPIC = "trade-events";

    public void publishTradeLoggedEvent(Trade trade) {
        try {
            // Map Trade -> TradeLoggedEvent (from common-library)
            TradeLoggedEvent event = new TradeLoggedEvent(
                    trade.getId(),
                    trade.getUserId(),
                    trade.getSymbol(),
                    trade.getMarket(),
                    trade.getDirection(),
                    trade.getEntryPrice(),
                    trade.getExitPrice(),
                    trade.getQuantity(),
                    trade.getPnl(),
                    trade.getEntryDate()
            );

            kafkaTemplate.send(TOPIC, String.valueOf(trade.getUserId()), event);
            log.info("📤 Published TradeLoggedEvent for trade ID: {}", trade.getId());

        } catch (Exception e) {
            log.error("❌ Failed to publish TradeLoggedEvent: {}", e.getMessage());
        }
    }
}