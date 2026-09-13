package com.tradejournal.tradeservice.event;

import com.tradejournal.commonlibrary.event.TradeLoggedEvent;
import com.tradejournal.tradeservice.entity.Trade;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class TradeEventPublisher {

    private final KafkaTemplate<String, Object> kafkaTemplate;
    private static final String TOPIC = "trade-events";

    @Async
    public void publishTradeLoggedEvent(Trade trade) {
        try {
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

            kafkaTemplate.send(TOPIC, String.valueOf(trade.getUserId()), event)
                    .whenComplete((result, ex) -> {
                        if (ex != null) {
                            log.warn("⚠️ Kafka publish failed for trade {}: {}",
                                    trade.getId(), ex.getMessage());
                        } else {
                            log.info("📤 Published TradeLoggedEvent for trade {} (partition: {}, offset: {})",
                                    trade.getId(),
                                    result.getRecordMetadata().partition(),
                                    result.getRecordMetadata().offset());
                        }
                    });
        } catch (Exception e) {
            log.warn("⚠️ Kafka publish exception (trade still saved): {}", e.getMessage());
        }
    }
}