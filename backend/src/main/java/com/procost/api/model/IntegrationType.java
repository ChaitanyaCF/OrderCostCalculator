package com.procost.api.model;

public enum IntegrationType {
    WEBHOOK_PUSH,    // Push data to external system via webhook
    API_PULL,        // Pull data from external system via API
    BIDIRECTIONAL    // Both push and pull
}
