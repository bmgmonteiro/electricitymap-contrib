import * as translation from '../helpers/translation';
import { createReducer } from '@reduxjs/toolkit';

import {
  GRID_DATA_FETCH_FAILED,
  GRID_DATA_FETCH_REQUESTED,
  GRID_DATA_FETCH_SUCCEEDED,
  initDataState,
  SOLAR_DATA_FETCH_FAILED,
  SOLAR_DATA_FETCH_REQUESTED,
  SOLAR_DATA_FETCH_SUCCEDED,
  WIND_DATA_FETCH_FAILED,
  WIND_DATA_FETCH_REQUESTED,
  WIND_DATA_FETCH_SUCCEDED,
  ZONE_HISTORY_FETCH_FAILED,
  ZONE_HISTORY_FETCH_REQUESTED,
  ZONE_HISTORY_FETCH_SUCCEEDED,
} from '../helpers/redux';

const initialState = initDataState();

const reducer = createReducer(initialState, (builder) => {
  builder
    .addCase(GRID_DATA_FETCH_SUCCEEDED, (state, action) => {
      const { countries, datetimes, exchanges, stateAggregation } = action.payload;
      const newState = Object.assign({}, state);
      const newExchanges = Object.assign({}, state.exchanges);
      const newZones = Object.assign({}, state.zones);

      Object.keys(newExchanges).forEach((key) => {
        newExchanges[key].netFlow = undefined;
      });
      Object.entries(countries).map(([zoneId, zoneData]) => {
        if (!newZones[zoneId]) {
          return;
        }
        newZones[zoneId][stateAggregation].overviews = zoneData;
      });

      newState.zones = newZones;
      newState.zoneDatetimes = { ...state.zoneDatetimes, [stateAggregation]: datetimes.map((dt) => new Date(dt)) };
      Object.entries(exchanges).forEach((entry) => {
        const [key, value] = entry;
        const exchange = newExchanges[key];
        if (!exchange || !exchange.lonlat) {
          console.warn(`Missing exchange configuration for ${key}. Ignoring..`);
          return;
        }
        // Assign all data
        Object.keys(value).forEach((k) => {
          newExchanges[k] = value[k];
        });
      });

      state.exchanges = newExchanges;
      state.zones = newZones;
      state.zoneDatetimes = { ...state.zoneDatetimes, [stateAggregation]: datetimes.map((dt) => new Date(dt)) };
      state.isLoadingGrid = false;
      state.hasInitializedGrid = true;
    })
    .addCase(GRID_DATA_FETCH_REQUESTED, (state) => {
      state.isLoadingGrid = true;
      state.hasConnectionWarning = false;
    })
    .addCase(GRID_DATA_FETCH_FAILED, (state) => {
      state.hasConnectionWarning = true;
      state.isLoadingGrid = false;
    })
    .addCase(ZONE_HISTORY_FETCH_SUCCEEDED, (state, action) => {
      const { stateAggregation, zoneStates, zoneId } = action.payload;
      state.isLoadingHistories = false;
      state.zones[zoneId][stateAggregation] = {
        ...state.zones[zoneId][stateAggregation],
        details: zoneStates,
        hasDetailedData: true,
        hasData: true, // fix;
        aggregation: stateAggregation,
        hasParser: true,
      };
    })
    .addCase(ZONE_HISTORY_FETCH_FAILED, (state) => {
      state.isLoadingHistories = false;
    })
    .addCase(ZONE_HISTORY_FETCH_REQUESTED, (state) => {
      state.isLoadingHistories = true;
    })
    .addCase(SOLAR_DATA_FETCH_SUCCEDED, (state, action) => {
      state.isLoadingSolar = false;
      state.solar = action.payload;
    })
    .addCase(SOLAR_DATA_FETCH_REQUESTED, (state) => {
      state.isLoadingSolar = true;
      state.solarDataError = null;
    })
    .addCase(SOLAR_DATA_FETCH_FAILED, (state) => {
      state.isLoadingSolar = false;
      state.solar = null;
      state.solarDataError = translation.translate('solarDataError');
    })
    .addCase(WIND_DATA_FETCH_SUCCEDED, (state, action) => {
      state.isLoadingWind = false;
      state.wind = action.payload;
    })
    .addCase(WIND_DATA_FETCH_REQUESTED, (state) => {
      state.isLoadingWind = true;
      state.windDataError = null;
    })
    .addCase(WIND_DATA_FETCH_FAILED, (state) => {
      state.isLoadingWind = false;
      state.wind = null;
      state.windDataError = translation.translate('windDataError');
    });
});

export default reducer;
