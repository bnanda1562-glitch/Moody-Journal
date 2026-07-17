const proxyModel = (modelName, mongooseModel) => {
  const handler = {
    get: function(target, prop, receiver) {
      const activeModel = process.env.USE_LOCAL_DB === 'true'
        ? require('./localDbMock')(modelName)
        : mongooseModel;
      
      const value = Reflect.get(activeModel, prop, receiver);
      if (typeof value === 'function') {
        return value.bind(activeModel);
      }
      return value;
    }
  };
  return new Proxy(mongooseModel, handler);
};

module.exports = proxyModel;
