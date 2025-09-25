-- Production Database Setup for Engineering Forecast
-- Run this in your Supabase SQL editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create sites table
CREATE TABLE IF NOT EXISTS sites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    sitekey VARCHAR(50) NOT NULL,
    public_id TEXT UNIQUE NOT NULL,
    pdf_uploaded BOOLEAN DEFAULT false,
    pdf_file_name VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create engineering_forecast table
CREATE TABLE IF NOT EXISTS engineering_forecast (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    site_id UUID NOT NULL UNIQUE,
    public_id TEXT UNIQUE NOT NULL,
    total_energy_to_grid DECIMAL(15,2),
    extraction_confidence DECIMAL(5,2),
    processing_status VARCHAR(50) DEFAULT 'pending',
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create engineering_forecast_periods table
CREATE TABLE IF NOT EXISTS engineering_forecast_periods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    forecast_id UUID NOT NULL REFERENCES engineering_forecast(id) ON DELETE CASCADE,
    year VARCHAR(4) NOT NULL,
    month VARCHAR(2) NOT NULL,
    kwh_value DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(forecast_id, year, month)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_sites_user_id ON sites(user_id);
CREATE INDEX IF NOT EXISTS idx_sites_user_sitekey ON sites(user_id, sitekey);
CREATE INDEX IF NOT EXISTS idx_engineering_forecast_site_id ON engineering_forecast(site_id);
CREATE INDEX IF NOT EXISTS idx_forecast_periods_forecast_id ON engineering_forecast_periods(forecast_id);
CREATE INDEX IF NOT EXISTS idx_forecast_periods_year_month ON engineering_forecast_periods(year, month);

-- Enable Row Level Security (RLS)
ALTER TABLE sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE engineering_forecast ENABLE ROW LEVEL SECURITY;
ALTER TABLE engineering_forecast_periods ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for sites
CREATE POLICY "Users can view their own sites" ON sites
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sites" ON sites
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sites" ON sites
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sites" ON sites
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for engineering_forecast
CREATE POLICY "Users can view forecasts for their sites" ON engineering_forecast
    FOR SELECT USING (
        site_id IN (
            SELECT id FROM sites WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert forecasts for their sites" ON engineering_forecast
    FOR INSERT WITH CHECK (
        site_id IN (
            SELECT id FROM sites WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update forecasts for their sites" ON engineering_forecast
    FOR UPDATE USING (
        site_id IN (
            SELECT id FROM sites WHERE user_id = auth.uid()
        )
    );

-- Create RLS policies for engineering_forecast_periods
CREATE POLICY "Users can view periods for their forecasts" ON engineering_forecast_periods
    FOR SELECT USING (
        forecast_id IN (
            SELECT ef.id FROM engineering_forecast ef
            JOIN sites s ON ef.site_id = s.id
            WHERE s.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert periods for their forecasts" ON engineering_forecast_periods
    FOR INSERT WITH CHECK (
        forecast_id IN (
            SELECT ef.id FROM engineering_forecast ef
            JOIN sites s ON ef.site_id = s.id
            WHERE s.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update periods for their forecasts" ON engineering_forecast_periods
    FOR UPDATE USING (
        forecast_id IN (
            SELECT ef.id FROM engineering_forecast ef
            JOIN sites s ON ef.site_id = s.id
            WHERE s.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete periods for their forecasts" ON engineering_forecast_periods
    FOR DELETE USING (
        forecast_id IN (
            SELECT ef.id FROM engineering_forecast ef
            JOIN sites s ON ef.site_id = s.id
            WHERE s.user_id = auth.uid()
        )
    );
