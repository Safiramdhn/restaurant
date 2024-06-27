const jwt = require('jsonwebtoken');
const _ = require('lodash');
const moment = require('moment');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const JWT_KEY = 'RES@tau!1279Rant?';

exports.decrypt = function (password, userPass) {
  return decrypt(password, userPass);
};

exports.encrypt = function (password, salt) {
  return encrypt(password, salt);
};

/**
 * A function that for decrypt data(password)
 *
 * @param {string} password string password hash value
 * @returns {string} string result
 */
function decrypt(password, userPass) {
  return bcrypt.compare(password, userPass);
}

/**
 * A function that for encrypt data(password)
 *
 * @param {string} str string password value
 * @param {string} salt string salt value
 * @returns {string} string hash result
 */
function encrypt(str, salt) {
  if (!str || !salt) {
    throw new Error('str & salt required');
  }

  if (typeof str !== 'string') {
    str = String(str);
  }

  try {
    return bcrypt.hash(str, salt);
  } catch (err) {
    throw new Error('Encryption Failed');
  }
}

/**
 * A function that for compare the hash password
 *
 * @param {string} strInput string hash value
 * @param {string} strDatabase string hash value
 * @param {string} salt string salt value
 * @returns {string} string hash result
 */

/**
 * A module that for generate the token
 *
 * @exports getToken
 * @param {object} tokenData object value want to generate to be token
 * @param {string} expiresIn token expired time, example: 3d, 18h
 * @returns {string} string of the token
 */
exports.getToken = function (tokenData, expiresIn) {
  let tokenExpiration;

  if (expiresIn) {
    tokenExpiration = {
      expiresIn: expiresIn ? expiresIn : '12h',
    };
  }

  let secretKey = process.env.JWT_KEY || JWT_KEY;
  return jwt.sign(tokenData, secretKey, tokenExpiration);
};

/**
 * A module that for get the user id from the token
 *
 * @exports getUserId
 * @param {string} token string of the token
 * @returns {string} user id
 */
exports.getUserId = function (token) {
  let secretKey = process.env.JWT_KEY || JWT_KEY;
  let tokenDecode = jwt.verify(token, secretKey);
  return tokenDecode.userId;
};

exports.getJwtDecode = function (token, ignoreExpiration) {
  let secretKey = process.env.JWT_KEY || JWT_KEY;
  let tokenDecode = jwt.verify(token, secretKey, { ignoreExpiration: ignoreExpiration === true });
  return tokenDecode;
};

/**
 * A function that for replace the string A-Z, a-z, and 0-9 with latin string
 *
 * @param {string} str string value
 * @returns {string} string latinise result
 */
const latinise = function (str) {
  return str.replace(/[^A-Za-z0-9[\] ]/g, function (a) {
    return latin_map[a] || a;
  });
};

/**
 * A module that for generate simple regexp value to giving the accent in search value, only for a,i,u,e,o
 * this function will search including the space
 *
 * @exports simpleDiacriticSensitiveRegex
 * @param {string} string string value
 * @returns {string} string result with accent
 */
exports.simpleDiacriticSensitiveRegex = function (string = '') {
  return string
    .replace(/[?$[\]\.*(\)^{}|+\\]/g, '\\$&')
    .replace(/a/g, '[a,á,à,ä]')
    .replace(/e/g, '[e,é,ë,è,ê]')
    .replace(/i/g, '[i,í,ï,Î,î]')
    .replace(/o/g, '[o,ó,ö,ò,ô]')
    .replace(/u/g, '[u,ü,ú,ù]')
    .replace(/c/g, '[c,ç]')
    .replace(/ /g, '[ ,-]');
};

/**
 * A module that for generate regexp value to giving the accent in search value
 * this function will search the data and treat space as or
 *
 * @exports diacriticSensitiveRegex
 * @param {string} string string value
 * @param {boolean} joinWordAsAlternative boolean value if want to join as alternatives ( | )
 * @returns {regexp} regex result
 */
exports.diacriticSensitiveRegex = function (string = '', joinWordAsAlternative = true) {
  /**
   * Creates a RegExp that matches the words in the search string.
   * Case and accent insensitive.
   */

  string = latinise(string.trim());

  // escape meta characters
  string = string.replace(/([|()[{.+*?^$\\])/g, '\\$1');

  // split into words
  let words = string.split(/\s+/);

  // replace characters by their compositors
  let accent_replacer = (chr) => {
    return accent_map[chr.toUpperCase()] || chr;
  };
  for (let i = 0; i < words.length; i++) {
    words[i] = words[i].replace(/\S/g, accent_replacer);
  }

  // join as alternatives
  let regexp;
  if (joinWordAsAlternative) {
    regexp = words.join('|');
  } else {
    regexp = words.join('');
  }

  return new RegExp(regexp, 'g');
};

exports.successResponse = function (message, data) {
  return {
    statusCode: 200,
    data: data,
    message: message,
  };
};

exports.createdResponse = function (message, data) {
  return {
    statusCode: 201,
    data: data,
    message: message,
  };
};

exports.customeResponse = function shorten(arr, obj) {
  let newObj = JSON.parse(JSON.stringify(obj));
  arr.forEach(function (key) {
    delete newObj[key];
  });
  return newObj;
};

exports.errorResponse = function (type, message) {
  switch (type) {
    case 'badRequest':
      return {
        statusCode: 400,
        error: 'Bad Request',
        message: message,
      };
      break;
    case 'unauthorized':
      return {
        statusCode: 401,
        error: 'Unauthorized',
        message: message,
      };
      break;
    case 'forbidden':
      return {
        statusCode: 403,
        error: 'Forbidden',
        message: message,
      };
      break;
    case 'notFound':
      return {
        statusCode: 404,
        error: 'Not Found',
        message: message,
      };
      break;
    case 'badImplementation':
      return {
        statusCode: 500,
        error: 'Internal Server Error',
        message: message,
      };
      break;
    default:
  }
};

exports.passwordPattern = new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.{8,72})');

/**
 * A module that for generate a UUID
 *
 * @exports create_UUID
 * @returns {string} UUID
 */
exports.create_UUID = function () {
  let dt = new Date().getTime();
  let uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    let r = (dt + Math.random() * 16) % 16 | 0;
    dt = Math.floor(dt / 16);
    return (c == 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
  return uuid;
};

/**
 * A module that check if the value in array has duplicate data!
 *
 * @exports hasDuplicates
 * @param {Array} a array value
 * @returns {Boolean} true if array has duplicated value, example: ['chicken', 'chicken, 'pig']
 */
exports.hasDuplicates = function (a) {
  return _.uniq(a).length !== a.length;
};

/**
 * A module that check if the value in array is same!
 *
 * @exports checkIfAllDataIsSame
 * @param {Array} a array value
 * @returns {Boolean} true if all data in array is same value, example: ['chicken', 'chicken, 'chicken']
 */
exports.checkIfAllDataIsSame = function (a) {
  return _.uniq(a).length === 1;
};

/**
 * A module to formating date from dateOnly to date
 *
 * @exports formatDateFromDateOnly
 * @param {dateOnly} dateObj dateOnly value
 * @returns {string} YYYY-MM-DD
 */
exports.formatDateFromDateOnly = function (dateObj) {
  let year = dateObj.getFullYear();
  let month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
  // added 0 just to fix indentation.
  let date = (dateObj.getDate() + 0).toString().padStart(2, '0');
  return `${year}-${month}-${date}`;
};

/**
 * A module to formating date from dateOnly to date DD/MM/YYYY
 *
 * @exports formatDateFromDateOnly
 * @param {dateOnly} dateObj dateOnly value
 * @returns {string} DD/MM/YYYY
 */
exports.formatDateFromDateOnlyToDDMMYYYY = function (dateObj) {
  const originalDate = String(dateObj);

  if (originalDate.length === 8) {
    // convert from yyyymmdd to date format accepted by mat datepicker
    const year = originalDate.substring(0, 4);
    const month = originalDate.substring(4, 6);
    const day = originalDate.substring(6, 8);
    return moment(new Date(year, month, day)).format('DD/MM/YYYY');
  }
};

exports.formatDate = function (date, format) {
  format = format.toLowerCase();

  if (!date) {
    date = new Date();
  }

  // if(typeof(date) === 'number'){
  //   date = new DateOnly(date);
  // }

  if (typeof date === 'string') {
    date = new Date(date);
  }

  if (typeof date === 'object' && date.year) {
    date = new Date(date.year, date.month, date.date);
  }

  if (format === 'dd-mm-yyyy') {
    return `${date.getDate().toString().padStart(2, '0')}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getFullYear()}`;
  } else if (format === 'ddmmyyyy') {
    return `${date.getDate().toString().padStart(2, '0')}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getFullYear()}`;
  } else {
    return date;
  }
};

/**
 * A module to make sure the value is array, and make it to be array if the value is object
 *
 * @exports ensureArray
 * @param {object || array} obj object or array value
 * @returns {array of object} array of object value
 */
exports.ensureArray = function (obj) {
  if (!_.isArray(obj)) {
    return [obj];
  }
  return obj;
};

exports.getDateAfterDays = function (days) {
  days = isNaN(days) ? 0 : days;
  return new Date(new Date().setDate(new Date().getDate() + days));
};

/**
 * A module to make string to be capitalize in first char
 *
 * @exports capitalize
 * @param {string} string string value
 * @returns {string} capitalize result
 */
exports.capitalize = function (string) {
  return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
};

exports.padWithChar = function (string, width, char) {
  char = char || '0';
  string = string + '';
  return string.length >= width ? string : new Array(width - string.length + 1).join(char) + string;
};

exports.isValidDate = function (s) {
  let separators = ['\\-', '\\/'];
  let bits = s.split(new RegExp(separators.join('|'), 'g'));
  let d = new Date(bits[2], bits[1] - 1, bits[0]);
  return d.getFullYear() == bits[2] && d.getMonth() + 1 == bits[1];
};

exports.leftPad = function (number, targetLength) {
  let output = number + '';
  while (output.length < targetLength) {
    output = '0' + output;
  }
  return output;
};

/**
 * A module to validate the email
 *
 * @exports validateEmail
 * @param {string} email email value
 * @returns {boolean} validation result
 */
exports.validateEmail = function (email) {
  let re =
    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(email);
};

// this function to help to return unique value from string of array
exports.onlyUnique = function (value, index, self) {
  return self.indexOf(value) === index;
};

/**
 * Compare value between 2 Objects
 * @param {*} objCompare | Object | old data of student
 * @param {*} objCompared | Object | Input from resolver
 * TRUE if have any difference
 * Return Boolean
 */
exports.equalObject = function (objCompare, objCompared) {
  try {
    if (!objCompare || !objCompared) return false;

    for (const objKey in objCompared) {
      if (['_id', 'createdAt', 'updatedAt', 'student_identity_status_updated', 'user_tour'].includes(objKey)) continue;

      //Check type mongoose object ID
      if (
        !['date_of_birth'].includes(objKey) &&
        mongoose.Types.ObjectId.isValid(objCompare[objKey]) &&
        String(objCompare[objKey]) !== String(objCompared[objKey])
      ) {
        return false;
      } else if (Array.isArray(objCompare[objKey])) {
        //Check type Array
        if (objCompare[objKey].length !== objCompared[objKey].length) {
          return false;
        }

        //Compare each element of array
        for (let index = 0; index < objCompare[objKey].length; index++) {
          delete objCompare[objKey][index]._id;

          const result = _.isEqual(objCompare[objKey][index], objCompared[objKey][index]);
          if (!result) return result;
        }
      } else if (
        //Check type Object
        typeof objCompare[objKey] === 'object' &&
        !Array.isArray(objCompare[objKey]) &&
        JSON.stringify(objCompare[objKey]) !== JSON.stringify(objCompared[objKey])
      ) {
        return false;
      } else if (['string', 'number'].includes(typeof objCompare[objKey])) {
        //On Student , date of birth stored as number
        if (['date_of_birth'].includes(objKey) && typeof objCompare[objKey] === 'number') {
          const dateFormatted = {
            year: String(objCompare[objKey]).substring(0, 4),
            month: String(objCompare[objKey]).substring(4, 6),
            date: String(objCompare[objKey]).substring(6, 8),
          };

          const dateOfBirth = moment
            .utc({
              year: dateFormatted.year,
              months: dateFormatted.month,
              date: dateFormatted.date,
            })
            .format('YYYY-MM-DD');

          if (objCompared[objKey] !== dateOfBirth) {
            return false;
          }
        } else if (objCompare[objKey] !== objCompared[objKey]) {
          //Check type string or number other than key date_of_birth
          return false;
        }
      }
    }

    return true;
  } catch (error) {
    console.log('Error on func equalObject:: ', error);
  }
};
