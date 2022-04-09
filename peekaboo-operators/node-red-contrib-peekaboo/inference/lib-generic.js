const axios = require("axios");
const FormData = require("form-data");
const Q = require("q");
("use strict");

/**
 * An API for serving models
 * @class PeekabooService
 * @param {object} [options] - The project domain or options object. If object, see the object's optional properties.
 * @param {string} [options.domain] - The project domain
 * @param {string} [options.dataaction] - The data action of the service
 * @param {string} [options.datatype] - The data type of the service
 * @param {object} [options.options] - Additional options
 */
class PeekabooService {
  constructor(options) {
    if (typeof options === "object") {
      const domain = options.domain;
      const dataaction = options.dataaction;
      const datatype = options.datatype;
      if (options.options !== undefined) {
        this.options = options.options;
      }

      if (domain && domain.length > 0) {
        this.domain = domain;
      } else {
        throw new Error("Domain parameter must be specified as a string.");
      }

      if (dataaction && dataaction.length > 0) {
        this.dataaction = dataaction;
      } else {
        throw new Error("Data action parameter must be specified as a string.");
      }

      if (datatype && datatype.length > 0) {
        this.datatype = datatype;
      } else {
        throw new Error("Data type parameter must be specified as a string.");
      }

      if (options.target) {
        this.target = options.target;
      }

      if (options.targetOptions) {
        this.targetOptions = options.targetOptions;
      }
    } else {
      throw new Error("Options must be specified as an object.");
    }
  }

  mergeQueryParams(parameters, queryParameters) {
    if (parameters.$queryParameters) {
      Object.keys(parameters.$queryParameters).forEach((parameterName) => {
        const parameter = parameters.$queryParameters[parameterName];
        queryParameters[parameterName] = parameter;
      });
    }
    return queryParameters;
  }

  /**
   * HTTP Request
   * @method
   * @name PeekabooService#request
   * @param {string} method - http method
   * @param {string} url - url to do request
   * @param {object} parameters
   * @param {object} body - body parameters / object
   * @param {object} headers - header parameters
   * @param {object} queryParameters - querystring parameters
   * @param {object} form - form data object
   * @param {object} deferred - promise object
   */
  request(
    method,
    url,
    parameters,
    body,
    headers,
    queryParameters,
    form,
    deferred
  ) {
    const req = {
      method: method,
      url: url,
      params: queryParameters,
      headers: headers,
      data: {},
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    };
    const formData = new FormData();
    if (Object.keys(form).length > 0) {
      formData.append(
        this.datatype,
        form[this.datatype],
        this.options.filename
      );
      for (let key of Object.keys(form)) {
        if (key != this.datatype && form[key] != null) {
          formData.append(key, form[key]);
        }
      }
      req.data = formData;
      req.headers = formData.getHeaders();
    }

    axios(req)
      .catch((error) => {
        deferred.reject(error);
      })
      .then((response) => {
        if (response == null) {
          deferred.reject({ response: response, body: body });
        } else {
          let body;
          if (
            /^application\/(.*\\+)?json/.test(response.headers["content-type"])
          ) {
            try {
              body = JSON.parse(response.data);
            } catch (e) {}
          }
          if (response.status === 204) {
            deferred.resolve({ response: response });
          } else if (response.status >= 200 && response.status <= 299) {
            deferred.resolve({ response: response, body: body });
          } else {
            deferred.reject({ response: response, body: body });
          }
        }
      });
  }

  /**
   * Return the metadata associated with the model
   * @method
   * @name PeekabooService#get_metadata
   * @param {object} parameters - method options and parameters
   */
  get_metadata(parameters) {
    if (parameters === undefined) {
      parameters = {};
    }
    const deferred = Q.defer();
    const domain = this.domain,
      path = "/model/metadata";
    const body = {},
      headers = {},
      form = {};
    let queryParameters = {};

    headers["Accept"] = ["application/json"];
    headers["Content-Type"] = ["application/json"];

    queryParameters = this.mergeQueryParams(parameters, queryParameters);

    this.request(
      "GET",
      domain + path,
      parameters,
      body,
      headers,
      queryParameters,
      form,
      deferred
    );

    return deferred.promise;
  }

  /**
   * Predict audio classes from input data
   * @method
   * @name PeekabooService#predict
   * @param {object} parameters - method options and parameters
   * @param {(file|object)} [parameters.data] - data to be sent
   */
  predict(parameters) {
    if (parameters === undefined) {
      parameters = {};
    }
    const deferred = Q.defer();
    const domain = this.domain,
          path = `/model/${this.dataaction}`;
    const body = {},
      headers = {};
    let form = {};
    let queryParameters = {};

    if (parameters[this.datatype] !== undefined) {
      form[this.datatype] = parameters[this.datatype];
    }
    if (this.targetOptions) {
      form = {
        ...form,
        ...this.targetOptions,
      };
    }

    if (parameters[this.datatype] === undefined) {
      deferred.reject(
        new Error(`Missing required parameter: ${this.datatype}`)
      );
      return deferred.promise;
    }

    queryParameters = this.mergeQueryParams(parameters, queryParameters);

    this.request(
      "POST",
      domain + path,
      parameters,
      body,
      headers,
      queryParameters,
      form,
      deferred
    );

    return deferred.promise;
  }
}

module.exports = { PeekabooService };
