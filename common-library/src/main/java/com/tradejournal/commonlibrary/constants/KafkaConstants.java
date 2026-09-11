package com.tradejournal.commonlibrary.constants;

public final class KafkaConstants {

    private KafkaConstants() {} // Prevent instantiation

    // Topic Names
    public static final String TOPIC_TRADE_EVENTS = "trade-events";
    public static final String TOPIC_ANALYTICS_UPDATE = "analytics-update";

    // Consumer Groups
    public static final String GROUP_ANALYTICS = "analytics-group";
    public static final String GROUP_INTEGRATION = "integration-group";
}