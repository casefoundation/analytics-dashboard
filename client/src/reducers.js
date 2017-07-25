import { combineReducers } from 'redux';
import {
  ACTION
} from './constants';

const initialDatasourcesState = {
  'data': {},
  'range': {
    'startDate': new Date(new Date().getTime() - 1000 * 60 * 60 * 24 * 30),
    'endDate': new Date()
  },
  'error': null
}

const datasources = (state = initialDatasourcesState, action) => {
  switch (action.type) {
    case ACTION.DATASOURCE.SET_NAMES:
      let newData = Object.assign({},state.data);
      action.names.forEach((name) => {
        if (!newData[name]) {
          const _newData = {};
          _newData[name] = {
            'loading': true,
            'data': []
          };
          newData = Object.assign({},newData,_newData)
        }
      });
      return Object.assign({},state,{
        'data': newData,
        'error': null
      });
    case ACTION.DATASOURCE.SET_DATA:
      return Object.assign({},state,{
        'data': Object.assign({},state.data,action.data),
        'error': null
      });
    case ACTION.DATASOURCE.ERROR:
      return Object.assign({},state,{
        'error': action.error
      });
    case ACTION.DATASOURCE.SET_RANGE:
      return Object.assign({},state,{
        'range': action.range
      });
    case ACTION.DATASOURCE.LOADING:
      if (state.data[action.datasource]) {
        const update = {};
        update[action.datasource] = Object.assign({},state.data[action.datasource],{
          'loading': action.loading
        });
        return Object.assign({},state,{
          'data': Object.assign({},state.data,update)
        });
      } else {
        return state;
      }
    default:
      return state;
  }
}

const rootReducer = combineReducers({
  datasources
})

export default rootReducer;
