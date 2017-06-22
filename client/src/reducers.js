import { combineReducers } from 'redux';
import {
  ACTION
} from './constants';

const initialDatasourcesState = {
  'data': {},
  'loading': false,
  'range': 1000 * 60 * 60 * 24 * 30,
  'error': null
}

const datasources = (state = initialDatasourcesState, action) => {
  switch (action.type) {
    case ACTION.DATASOURCE.SET_NAMES:
      let newData = Object.assign({},state.data);
      action.names.forEach((name) => {
        if (!newData[name]) {
          const _newData = {};
          _newData[name] = [];
          newData = Object.assign({},newData,_newData)
        }
      });
      return Object.assign({},state,{
        'data': newData,
        'error': null,
        'loading': false
      });
    case ACTION.DATASOURCE.SET_DATA:
      return Object.assign({},state,{
        'data': Object.assign({},state.data,action.data),
        'error': null,
        'loading': false
      });
    case ACTION.DATASOURCE.ERROR:
      return Object.assign({},state,{
        'error': action.error,
        'loading': false
      });
    case ACTION.DATASOURCE.SET_RANGE:
      return Object.assign({},state,{
        'range': action.range,
        'loading': false
      });
    case ACTION.DATASOURCE.LOADING:
      return Object.assign({},state,{
        'loading': action.loading
      });
    default:
      return state;
  }
}

const rootReducer = combineReducers({
  datasources
})

export default rootReducer;
