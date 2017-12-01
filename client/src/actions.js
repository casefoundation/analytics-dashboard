import {
  ACTION,
  API_URL
} from './constants';

export const setDashboardName = (dashboard) => {
  return {
    'type': ACTION.DATASOURCE.SET_DASHBOARD,
    'dashboard': dashboard
  };
}

export const setQueryRange = (startDate,endDate) => {
  return {
    'type': ACTION.DATASOURCE.SET_RANGE,
    'range': {
      startDate,
      endDate
    }
  }
}

export const fetchDashboardNames = () => {
  return (dispatch,getState) => {
    fetch(API_URL+'/api/dashboard')
      .then((response) => response.json())
      .then((dashboards) => {
        dispatch({
          'type': ACTION.DATASOURCE.SET_DASHBOARDS,
          dashboards
        });
      })
      .catch((error) => {
        dispatch({
          'type': ACTION.DATASOURCE.ERROR,
          error
        });
      });
  }
}

export const fetchDatasourceNames = () => {
  return (dispatch,getState) => {
    const dashboard = getState().datasources.dashboard;
    fetch(API_URL+'/api/' + dashboard + '/datasource')
      .then((response) => response.json())
      .then((names) => {
        if (dashboard === getState().datasources.dashboard) {
          dispatch({
            'type': ACTION.DATASOURCE.SET_NAMES,
            names
          });
          dispatch(fetchAllDatasourcesData());
        }
      })
      .catch((error) => {
        dispatch({
          'type': ACTION.DATASOURCE.ERROR,
          error
        });
      });
  }
}

export const fetchAllDatasourcesData = () => {
  return (dispatch,getState) => {
    for(var name in getState().datasources.data) {
      dispatch(fetchDatasourceData(name));
    }
  }
}

export const fetchDatasourceData = (datasourceName) => {
  return (dispatch,getState) => {
    dispatch({
      'type': ACTION.DATASOURCE.LOADING,
      'datasource': datasourceName,
      'loading': true
    });
    const dashboard = getState().datasources.dashboard;
    fetch(API_URL+'/api/' + dashboard + '/datasource/' + datasourceName + '?startDate=' + encodeURIComponent(getState().datasources.range.startDate.getTime()) + '&endDate=' + encodeURIComponent(getState().datasources.range.endDate.getTime()))
      .then((response) => response.json())
      .then((data) => {
        if (dashboard === getState().datasources.dashboard) {
          const action = {
            'type': ACTION.DATASOURCE.SET_DATA,
            'data': {}
          }
          action.data[datasourceName] = {
            'loading': false,
            data
          };
          dispatch(action);
        }
      })
      .catch((error) => {
        dispatch({
          'type': ACTION.DATASOURCE.ERROR,
          error
        });
      });
  }
}
