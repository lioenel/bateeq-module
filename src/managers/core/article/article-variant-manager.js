'use strict';

// external deps 
var ObjectId = require('mongodb').ObjectId;

// internal deps
require('mongodb-toolkit');
var BateeqModels = require('bateeq-models');
var map = BateeqModels.map;

var ArticleApproval = BateeqModels.core.article.ArticleApproval;
var ArticleBrand = BateeqModels.core.article.ArticleBrand;
var ArticleCategory = BateeqModels.core.article.ArticleCategory;
var ArticleColor = BateeqModels.core.article.ArticleColor;
var ArticleCostCalculationDetail = BateeqModels.core.article.ArticleCostCalculationDetail;
var ArticleCostCalculation = BateeqModels.core.article.ArticleCostCalculation;
var ArticleCounter = BateeqModels.core.article.ArticleCounter;
var ArticleMaterial = BateeqModels.core.article.ArticleMaterial;
var ArticleMotif = BateeqModels.core.article.ArticleMotif;
var ArticleOrigin = BateeqModels.core.article.ArticleOrigin;
var ArticleSeason = BateeqModels.core.article.ArticleSeason;
var ArticleSize = BateeqModels.core.article.ArticleSize;
var ArticleSubCounter = BateeqModels.core.article.ArticleSubCounter;
var ArticleTheme = BateeqModels.core.article.ArticleTheme;
var ArticleType = BateeqModels.core.article.ArticleType;
var ArticleVariant = BateeqModels.core.article.ArticleVariant;
var Article = BateeqModels.core.article.Article;

module.exports = class ArticleVariantManager {
    constructor(db, user) {
        this.db = db;
        this.user = user;
        this.articleVariantCollection = this.db.use(map.core.article.ArticleVariant);
    }

    read(paging) {
        var _paging = Object.assign({
            page: 1,
            size: 20,
            order: '_id',
            asc: true
        }, paging);

        return new Promise((resolve, reject) => {
            var deleted = {
                _deleted: false
            };
            var query = _paging.keyword ? {
                '$and': [deleted]
            } : deleted;

            if (_paging.keyword) {
                var regex = new RegExp(_paging.keyword, "i");
                var filterCode = {
                    'code': {
                        '$regex': regex
                    }
                };
                var filterName = {
                    'name': {
                        '$regex': regex
                    }
                };
                var $or = {
                    '$or': [filterCode, filterName]
                };

                query['$and'].push($or);
            }


            this.articleVariantCollection
                .where(query)
                .page(_paging.page, _paging.size)
                .orderBy(_paging.order, _paging.asc)
                .execute()
                .then(articleVariants => {
                    resolve(articleVariants);
                })
                .catch(e => {
                    reject(e);
                });
        });
    }

    getById(id) {
        return new Promise((resolve, reject) => {
            if (id === '')
                resolve(null);
            var query = {
                _id: new ObjectId(id),
                _deleted: false
            };
            this.getSingleByQuery(query)
                .then(articleVariant => {
                    resolve(articleVariant);
                })
                .catch(e => {
                    reject(e);
                });
        });
    }

    getByIdOrDefault(id) {
        return new Promise((resolve, reject) => {
            if (id === '')
                resolve(null);
            var query = {
                _id: new ObjectId(id),
                _deleted: false
            };
            this.getSingleOrDefaultByQuery(query)
                .then(articleVariant => {
                    resolve(articleVariant);
                })
                .catch(e => {
                    reject(e);
                });
        });
    }

    getSingleByQuery(query) {
        return new Promise((resolve, reject) => {
            this.articleVariantCollection
                .single(query)
                .then(articleVariant => {
                    resolve(articleVariant);
                })
                .catch(e => {
                    reject(e);
                });
        })
    }

    getSingleOrDefaultByQuery(query) {
        return new Promise((resolve, reject) => {
            this.articleVariantCollection
                .singleOrDefault(query)
                .then(articleVariant => {
                    resolve(articleVariant);
                })
                .catch(e => {
                    reject(e);
                });
        })
    }

    create(articleVariant) {
        return new Promise((resolve, reject) => {
            this._validate(articleVariant)
                .then(validArticleVariant => {

                    this.articleVariantCollection.insert(validArticleVariant)
                        .then(id => {
                            resolve(id);
                        })
                        .catch(e => {
                            reject(e);
                        })
                })
                .catch(e => {
                    reject(e);
                })
        });
    }

    update(articleVariant) {
        return new Promise((resolve, reject) => {
            this._validate(articleVariant)
                .then(validArticleVariant => {
                    this.articleVariantCollection.update(validArticleVariant)
                        .then(id => {
                            resolve(id);
                        })
                        .catch(e => {
                            reject(e);
                        })
                })
                .catch(e => {
                    reject(e);
                })
        });
    }

    delete(articleVariant) {
        return new Promise((resolve, reject) => {
            this._validate(articleVariant)
                .then(validArticleVariant => {
                    validArticleVariant._deleted = true;
                    this.articleVariantCollection.update(validArticleVariant)
                        .then(id => {
                            resolve(id);
                        })
                        .catch(e => {
                            reject(e);
                        })
                })
                .catch(e => {
                    reject(e);
                })
        });
    }
 
    _validate(articleVariant) {
        var errors = {};
        return new Promise((resolve, reject) => {
            var valid = new ArticleVariant(articleVariant);
            // 1. begin: Declare promises.
            var getArticleVariant = this.articleVariantCollection.singleOrDefault({
                "$and": [{
                    _id: {
                        '$ne': new ObjectId(valid._id)
                    }
                }, {
                        code: valid.code
                    }]
            });
            // 1. end: Declare promises.

            // 2. begin: Validation.
            Promise.all([getArticleVariant])
                .then(results => {
                    var _articleVariant = results[0];

                    if (!valid.code || valid.code == '')
                        errors["code"] = "code is required";
                    else if (_articleVariant)
                        errors["code"] = "code already exists"; 
                        
                    if (!valid.name || valid.name == '')
                        errors["name"] = "name is required";  
                        
                    if (!valid.size || valid.size == '')
                        errors["size"] = "size is required";  
                        
                    if (valid.domesticCOGS == undefined || (valid.domesticCOGS && valid.domesticCOGS == '')) {
                        errors["domesticCOGS"] = "domesticCOGS is required";
                    }
                    else if (parseInt(valid.domesticCOGS) < 0) {
                        errors["domesticCOGS"] = "domesticCOGS must be greater with 0";
                    }
                    if (valid.domesticWholesale == undefined || (valid.domesticWholesale && valid.domesticWholesale == '')) {
                        errors["domesticWholesale"] = "domesticWholesale is required";
                    }
                    else if (parseInt(valid.domesticWholesale) < 0) {
                        errors["domesticWholesale"] = "domesticWholesale must be greater with 0";
                    }
                    if (valid.domesticRetail == undefined || (valid.domesticRetail && valid.domesticRetail == '')) {
                        errors["domesticRetail"] = "domesticRetail is required";
                    }
                    else if (parseInt(valid.domesticRetail) < 0) {
                        errors["domesticRetail"] = "domesticRetail must be greater with 0";
                    } 
                    if (valid.domesticSale == undefined || (valid.domesticSale && valid.domesticSale == '')) {
                        errors["domesticSale"] = "domesticSale is required";
                    }
                    else if (parseInt(valid.domesticSale) < 0) {
                        errors["domesticSale"] = "domesticSale must be greater with 0";
                    } 
                    if (valid.internationalCOGS == undefined || (valid.internationalCOGS && valid.internationalCOGS == '')) {
                        errors["internationalCOGS"] = "internationalCOGS is required";
                    }
                    else if (parseInt(valid.internationalCOGS) < 0) {
                        errors["internationalCOGS"] = "internationalCOGS must be greater with 0";
                    }
                    if (valid.internationalWholesale == undefined || (valid.internationalWholesale && valid.internationalWholesale == '')) {
                        errors["internationalWholesale"] = "internationalWholesale is required";
                    }
                    else if (parseInt(valid.internationalWholesale) < 0) {
                        errors["internationalWholesale"] = "internationalWholesale must be greater with 0";
                    }
                    if (valid.internationalRetail == undefined || (valid.internationalRetail && valid.internationalRetail == '')) {
                        errors["internationalRetail"] = "internationalRetail is required";
                    }
                    else if (parseInt(valid.internationalRetail) < 0) {
                        errors["internationalRetail"] = "internationalRetail must be greater with 0";
                    }
                    if (valid.internationalSale == undefined || (valid.internationalSale && valid.internationalSale == '')) {
                        errors["internationalSale"] = "internationalSale is required";
                    }
                    else if (parseInt(valid.internationalSale) < 0) {
                        errors["internationalSale"] = "internationalSale must be greater with 0";
                    } 

                    // 2c. begin: check if data has any error, reject if it has.
                    for (var prop in errors) {
                        var ValidationError = require('../../../validation-error');
                        reject(new ValidationError('data does not pass validation', errors));
                    }

                    valid.stamp(this.user.username, 'manager');
                    resolve(valid);
                })
                .catch(e => {
                    reject(e);
                })
        });
    }
};