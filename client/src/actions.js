import {
  ACTION,
  API_URL
} from './constants';

export const setQueryRange = (range) => {
  return {
    'type': ACTION.DATASOURCE.SET_RANGE,
    range
  }
}

export const fetchDatasourceNames = () => {
  return (dispatch,getState) => {
    fetch(API_URL+'/api/datasource')
      .then((response) => response.json())
      .then((names) => {
        dispatch({
          'type': ACTION.DATASOURCE.SET_NAMES,
          names
        });
        dispatch(fetchAllDatasourcesData());
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
    fetch(API_URL+'/api/datasource/' + datasourceName + '?range=' + encodeURIComponent(getState().datasources.range))
      .then((response) => response.json())
      .then((data) => {
        const action = {
          'type': ACTION.DATASOURCE.SET_DATA,
          'data': {}
        }
        action.data[datasourceName] = {
          'loading': false,
          data
        };
        dispatch(action);
      })
      .catch((error) => {
        dispatch({
          'type': ACTION.DATASOURCE.ERROR,
          error
        });
      });
  }
}
