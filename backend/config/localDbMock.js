const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const dbFile = path.join(__dirname, 'local_db.json');

// Ensure local file exists
const readDB = () => {
  if (!fs.existsSync(dbFile)) {
    fs.writeFileSync(dbFile, JSON.stringify({
      User: [],
      Journal: [],
      VoiceJournal: [],
      Notification: [],
      Tracker: []
    }, null, 2));
  }
  try {
    return JSON.parse(fs.readFileSync(dbFile, 'utf8'));
  } catch (e) {
    return { User: [], Journal: [], VoiceJournal: [], Notification: [], Tracker: [] };
  }
};

const writeDB = (data) => {
  fs.writeFileSync(dbFile, JSON.stringify(data, null, 2));
};

// Document wrapper to support Mongoose operations
const wrapDoc = (doc, modelName) => {
  if (!doc) return null;
  return {
    ...doc,
    id: doc._id,
    save: async function() {
      const db = readDB();
      const list = db[modelName];
      const idx = list.findIndex(item => item._id === this._id);
      
      // Hash password if modifying password field (for Users)
      if (modelName === 'User' && this.password && (!doc.password || this.password !== doc.password)) {
        if (!this.password.startsWith('$2a$')) {
          const salt = await bcrypt.genSalt(10);
          this.password = await bcrypt.hash(this.password, salt);
        }
      }

      const cleanDoc = { ...this };
      // Delete functions from stored JSON
      delete cleanDoc.save;
      delete cleanDoc.deleteOne;
      delete cleanDoc.matchPassword;
      delete cleanDoc.id;

      if (idx > -1) {
        list[idx] = cleanDoc;
      } else {
        list.push(cleanDoc);
      }
      writeDB(db);
      return wrapDoc(cleanDoc, modelName);
    },
    deleteOne: async function() {
      const db = readDB();
      db[modelName] = db[modelName].filter(item => item._id !== this._id);
      writeDB(db);
      return { deletedCount: 1 };
    },
    matchPassword: async function(enteredPassword) {
      return await bcrypt.compare(enteredPassword, this.password);
    }
  };
};

// Create a query matching function
const matchQuery = (item, query) => {
  if (!query) return true;
  
  for (const key in query) {
    const val = query[key];
    
    // Text search mock
    if (key === '$text') {
      const searchStr = val.$search?.toLowerCase() || '';
      const textMatch = 
        (item.title && item.title.toLowerCase().includes(searchStr)) || 
        (item.content && item.content.toLowerCase().includes(searchStr));
      if (!textMatch) return false;
      continue;
    }

    // Date filters mock
    if (key === 'createdAt' && typeof val === 'object') {
      const itemDate = new Date(item.createdAt);
      if (val.$gte && itemDate < new Date(val.$gte)) return false;
      if (val.$lte && itemDate > new Date(val.$lte)) return false;
      continue;
    }

    // Default match
    if (item[key] !== val) {
      // Allow object id matching string representation
      if (item[key] && item[key].toString() === val.toString()) {
        continue;
      }
      return false;
    }
  }
  return true;
};

// Mock Query Chain
const makeChain = (results, modelName) => {
  const chain = {
    sort: function() {
      results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      return chain;
    },
    limit: function(num) {
      results = results.slice(0, num);
      return chain;
    },
    populate: function(field) {
      if (field === 'userId') {
        const db = readDB();
        results = results.map(item => {
          const userDoc = db.User.find(u => u._id === item.userId?.toString());
          return {
            ...item,
            userId: userDoc ? { _id: userDoc._id, name: userDoc.name, avatar: userDoc.avatar } : null
          };
        });
      }
      return chain;
    },
    select: function() {
      return chain;
    },
    // Support executing then/catch promise chain
    then: function(resolve) {
      resolve(results.map(r => wrapDoc(r, modelName)));
    }
  };
  return chain;
};

const makeFindOneChain = (result, modelName) => {
  const chain = {
    select: function() {
      return chain;
    },
    populate: function(field) {
      if (field === 'userId' && result) {
        const db = readDB();
        const userDoc = db.User.find(u => u._id === result.userId?.toString());
        result = {
          ...result,
          userId: userDoc ? { _id: userDoc._id, name: userDoc.name, avatar: userDoc.avatar } : null
        };
      }
      return chain;
    },
    then: function(resolve) {
      resolve(wrapDoc(result, modelName));
    }
  };
  return chain;
};

module.exports = (modelName) => {
  return {
    modelName,

    create: async function(doc) {
      const db = readDB();
      const newDoc = {
        _id: Math.random().toString(36).substring(2, 11) + Math.random().toString(36).substring(2, 11),
        createdAt: new Date().toISOString(),
        ...doc
      };

      // Encrypt password if User
      if (modelName === 'User' && newDoc.password) {
        const salt = await bcrypt.genSalt(10);
        newDoc.password = await bcrypt.hash(newDoc.password, salt);
      }

      db[modelName].push(newDoc);
      writeDB(db);
      return wrapDoc(newDoc, modelName);
    },

    find: function(query) {
      const db = readDB();
      const results = db[modelName].filter(item => matchQuery(item, query));
      return makeChain(results, modelName);
    },

    findOne: function(query) {
      const db = readDB();
      const result = db[modelName].find(item => matchQuery(item, query));
      return makeFindOneChain(result, modelName);
    },

    findById: async function(id) {
      const db = readDB();
      const result = db[modelName].find(item => item._id === id?.toString());
      return wrapDoc(result, modelName);
    },

    countDocuments: async function(query) {
      const db = readDB();
      const results = db[modelName].filter(item => matchQuery(item, query));
      return results.length;
    },

    deleteMany: async function(query) {
      const db = readDB();
      const beforeCount = db[modelName].length;
      db[modelName] = db[modelName].filter(item => !matchQuery(item, query));
      writeDB(db);
      return { deletedCount: beforeCount - db[modelName].length };
    },

    updateMany: async function(query, update) {
      const db = readDB();
      let matchedCount = 0;
      db[modelName] = db[modelName].map(item => {
        if (matchQuery(item, query)) {
          matchedCount++;
          return { ...item, ...update.$set || update };
        }
        return item;
      });
      writeDB(db);
      return { matchedCount };
    },

    // Specific analytics aggregates mock
    aggregate: async function(stages) {
      const db = readDB();
      
      // Mock for platform stats: average mood across all journals
      if (modelName === 'Journal' && stages.length > 0 && stages[0].$match) {
        const journals = db.Journal.filter(j => !j.isDraft);
        const sum = journals.reduce((acc, curr) => acc + (curr.emotionScore || 50), 0);
        const avg = journals.length > 0 ? Math.round(sum / journals.length) : 50;
        
        // Mock group by userId
        const groupByUser = {};
        journals.forEach(j => {
          groupByUser[j.userId] = (groupByUser[j.userId] || 0) + 1;
        });

        const activeUsersList = Object.keys(groupByUser).map(uid => ({
          _id: uid,
          journalCount: groupByUser[uid]
        })).sort((a, b) => b.journalCount - a.journalCount);

        // If checking average mood
        if (stages[1] && stages[1].$group && stages[1].$group.avgEmotion) {
          return [{ _id: null, avgEmotion: avg }];
        }
        
        return activeUsersList;
      }
      
      return [];
    }
  };
};
