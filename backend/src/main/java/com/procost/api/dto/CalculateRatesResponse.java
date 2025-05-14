package com.procost.api.dto;

public class CalculateRatesResponse {
    private Double filingRate;
    private Double packagingRate;

    public CalculateRatesResponse(Double filingRate, Double packagingRate) {
        this.filingRate = filingRate;
        this.packagingRate = packagingRate;
    }

    public Double getFilingRate() {
        return filingRate;
    }

    public void setFilingRate(Double filingRate) {
        this.filingRate = filingRate;
    }

    public Double getPackagingRate() {
        return packagingRate;
    }

    public void setPackagingRate(Double packagingRate) {
        this.packagingRate = packagingRate;
    }
}