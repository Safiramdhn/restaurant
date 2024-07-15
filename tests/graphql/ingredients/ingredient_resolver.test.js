/* eslint-disable no-undef */
require('dotenv').config();
const mongoose = require('mongoose');
const randomstring = require('randomstring');

const IngredientModel = require('../../../graphql/ingredients/ingredient.model');
const UserModel = require('../../../graphql/users/user.model');
const UserTypeModel = require('../../../graphql/userTypes/user_type.model');
const RecipeModel = require('../../../graphql/recipes/recipe.model');
const { Mutation, Query } = require('../../../graphql/ingredients/ingredient.resolvers');

const ObjectId = mongoose.Types.ObjectId;
const ingredientTestData = require('./ingredient_test_data');

// MUTATION
describe('AddIngredient Mutation', () => {
  let mockUserModelFindById;
  let mockIngredientModelFindOne;
  let mockIngredientModelCreate;

  // initiate before run each testing
  beforeEach(() => {
    // clear mock
    jest.clearAllMocks();

    // define mock for database
    mockUserModelFindById = jest.spyOn(UserModel, 'findById');
    mockIngredientModelFindOne = jest.spyOn(IngredientModel, 'findOne');
    mockIngredientModelCreate = jest.spyOn(IngredientModel, 'create');
  });

  it('Should return new ingredient data with only specific user type and valid input', async () => {
    const ingredient_input = {
      name: randomstring.generate(9),
      stock_amount: 10,
    };
    const userData = ingredientTestData.users[0];

    mockUserModelFindById.mockImplementation(() => {
      return {
        populate: jest.fn().mockImplementation(() => {
          return {
            lean: jest.fn().mockResolvedValue(userData),
          };
        }),
      };
    });
    mockIngredientModelFindOne.mockImplementation(() => {
      return {
        lean: jest.fn().mockResolvedValue(null),
      };
    });

    mockIngredientModelCreate.mockResolvedValue({
      ...ingredient_input,
      _id: new ObjectId(),
      is_available: true,
    });
    const addIngredientResult = await Mutation.AddIngredient(null, { ingredient_input }, { userId: userData._id });

    expect(mockUserModelFindById).toHaveBeenCalledTimes(1);
    expect(mockIngredientModelFindOne).toHaveBeenCalledTimes(1);
    expect(mockIngredientModelCreate).toHaveBeenCalledTimes(1);

    expect(addIngredientResult.name).toEqual(ingredient_input.name);
    expect(addIngredientResult.stock_amount).toEqual(ingredient_input.stock_amount);
    expect(addIngredientResult.is_available).toStrictEqual(true);
  });

  it('Should return new ingredient data with availble status is false, only specific user type, and valid input', async () => {
    const ingredient_input = {
      name: randomstring.generate(9),
      stock_amount: 0,
    };
    const userData = ingredientTestData.users[0];

    mockUserModelFindById.mockImplementation(() => {
      return {
        populate: jest.fn().mockImplementation(() => {
          return {
            lean: jest.fn().mockResolvedValue(userData),
          };
        }),
      };
    });
    mockIngredientModelFindOne.mockImplementation(() => {
      return {
        lean: jest.fn().mockResolvedValue(null),
      };
    });

    mockIngredientModelCreate.mockResolvedValue({
      ...ingredient_input,
      _id: new ObjectId(),
      is_available: false,
    });
    const addIngredientResult = await Mutation.AddIngredient(null, { ingredient_input }, { userId: userData._id });

    expect(mockUserModelFindById).toHaveBeenCalledTimes(1);
    expect(mockIngredientModelFindOne).toHaveBeenCalledTimes(1);
    expect(mockIngredientModelCreate).toHaveBeenCalledTimes(1);

    expect(addIngredientResult.name).toEqual(ingredient_input.name);
    expect(addIngredientResult.stock_amount).toEqual(ingredient_input.stock_amount);
    expect(addIngredientResult.is_available).toStrictEqual(false);
  });

  it('Should throw error if user type is not General Admin or Stock Admin', async () => {
    const userData = ingredientTestData.users[1];
    const ingredient_input = {
      name: randomstring.generate(9),
      stock_amount: 10,
    };

    mockUserModelFindById.mockImplementation(() => {
      return {
        populate: jest.fn().mockImplementation(() => {
          return {
            lean: jest.fn().mockResolvedValue(userData),
          };
        }),
      };
    });

    await expect(Mutation.AddIngredient(null, { ingredient_input }, { userId: userData._id })).rejects.toThrowError(
      'Only General Admin or Stock Admin can add new ingredient'
    );

    expect(mockIngredientModelFindOne).not.toHaveBeenCalled();
    expect(mockIngredientModelCreate).not.toHaveBeenCalled();
  });

  it('Should throw error if ingredient name is null or empty', async () => {
    const userData = ingredientTestData.users[0];
    let ingredient_input = {
      stock_amount: 10,
    };

    mockUserModelFindById.mockImplementation(() => {
      return {
        populate: jest.fn().mockImplementation(() => {
          return {
            lean: jest.fn().mockResolvedValue(userData),
          };
        }),
      };
    });

    await expect(Mutation.AddIngredient(null, { ingredient_input }, { userId: userData._id })).rejects.toThrowError('Ingredient must has a name');

    ingredient_input.name = '';
    await expect(Mutation.AddIngredient(null, { ingredient_input }, { userId: userData._id })).rejects.toThrowError('Ingredient must has a name');

    expect(mockUserModelFindById).toHaveBeenCalledTimes(2);
    expect(mockIngredientModelFindOne).not.toHaveBeenCalled();
    expect(mockIngredientModelCreate).not.toHaveBeenCalled();
  });

  it('Should throw error if ingredient name is already existed', async () => {
    const userData = ingredientTestData.users[0];
    const ingredientData = ingredientTestData.ingredients[0];
    const ingredient_input = {
      name: ingredientData.name,
      stock_amount: 10,
    };

    mockUserModelFindById.mockImplementation(() => {
      return {
        populate: jest.fn().mockImplementation(() => {
          return {
            lean: jest.fn().mockResolvedValue(userData),
          };
        }),
      };
    });
    mockIngredientModelFindOne.mockImplementation(() => {
      return {
        lean: jest.fn().mockResolvedValue(ingredientData),
      };
    });

    await expect(Mutation.AddIngredient(null, { ingredient_input }, { userId: userData._id })).rejects.toThrowError(
      `${ingredient_input.name} is already existed`
    );

    expect(mockUserModelFindById).toHaveBeenCalledTimes(1);
    expect(mockIngredientModelFindOne).toHaveBeenCalledTimes(1);
    expect(mockIngredientModelCreate).not.toHaveBeenCalled();
  });
});

describe('UpdateIngredient Mutation', () => {
  let mockUserModelFindById;
  let mockIngredientModelFindById;
  let mockIngredientModelFindOne;
  let mockIngredientModelFindByIdAndUpdate;

  // connect once to database for testing
  beforeAll(async () => {
    const mongoURI = `mongodb://${process.env.DB_TESTING_HOST}/${process.env.DB_TESTING_NAME}`;
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
  });

  // close database connection
  afterAll(async () => {
    await mongoose.connection.close();
  });

  // initiate before run each testing
  beforeEach(() => {
    // clear mock
    jest.clearAllMocks();

    // define mock for database
    mockUserModelFindById = jest.spyOn(UserModel, 'findById');
    mockIngredientModelFindById = jest.spyOn(IngredientModel, 'findById');
    mockIngredientModelFindOne = jest.spyOn(IngredientModel, 'findOne');
    mockIngredientModelFindByIdAndUpdate = jest.spyOn(IngredientModel, 'findByIdAndUpdate');
  });

  it('Should return updated ingredient with id, valid input, and specific usertype', async () => {
    const ingredientData = ingredientTestData.ingredients[1];
    const userData = ingredientTestData.users[0];
    const ingredient_input = {
      name: randomstring.generate(9),
      stock_amount: 0,
    };

    mockUserModelFindById.mockImplementation(() => {
      return {
        populate: jest.fn().mockImplementation(() => {
          return {
            lean: jest.fn().mockResolvedValue(userData),
          };
        }),
      };
    });

    mockIngredientModelFindById.mockImplementation(() => {
      return {
        lean: jest.fn().mockResolvedValue(ingredientData),
      };
    });

    mockIngredientModelFindOne.mockImplementation(() => {
      return {
        lean: jest.fn().mockResolvedValue(null),
      };
    });

    mockIngredientModelFindByIdAndUpdate.mockResolvedValue({
      ...ingredientData,
      name: ingredient_input.name,
      stock_amount: ingredient_input.stock_amount,
      is_available: false,
    });
    const updateIngredientResult = await Mutation.UpdateIngredient(null, { ingredient_input }, { userId: userData._id });

    expect(mockUserModelFindById).toHaveBeenCalledTimes(1);
    expect(mockIngredientModelFindById).toHaveBeenCalledTimes(1);
    expect(mockIngredientModelFindOne).toHaveBeenCalledTimes(1);
    expect(mockIngredientModelFindByIdAndUpdate).toHaveBeenCalledTimes(1);

    expect(updateIngredientResult.name).toEqual(ingredient_input.name);
    expect(updateIngredientResult.stock_amount).toEqual(ingredient_input.stock_amount);
    expect(updateIngredientResult.is_available).toStrictEqual(false);
    expect(updateIngredientResult.update_histories.user).toStrictEqual(userData._id);
  });

  it('Should throw error if user type is not General Admin or Stock Admin', async () => {
    const userData = ingredientTestData.users[1];
    const ingredient_input = {
      name: randomstring.generate(9),
      stock_amount: 10,
    };

    mockUserModelFindById.mockImplementation(() => {
      return {
        populate: jest.fn().mockImplementation(() => {
          return {
            lean: jest.fn().mockResolvedValue(userData),
          };
        }),
      };
    });

    await expect(Mutation.AddIngredient(null, { ingredient_input }, { userId: userData._id })).rejects.toThrowError(
      'Only General Admin or Stock Admin can add new ingredient'
    );

    expect(mockUserModelFindById).toHaveBeenCalledTimes(1);
    expect(mockIngredientModelFindById).not.toHaveBeenCalled();
    expect(mockIngredientModelFindOne).not.toHaveBeenCalled();
    expect(mockIngredientModelFindByIdAndUpdate).not.toHaveBeenCalled();
  });

  it('Should throw error if ingredient name is already existed', async () => {
    const userData = ingredientTestData.users[0];
    const ingredientData = ingredientTestData.ingredients[1];
    const existedIngredient = ingredientTestData.ingredients[0];
    const ingredient_input = {
      name: existedIngredient.name,
    };

    mockUserModelFindById.mockImplementation(() => {
      return {
        populate: jest.fn().mockImplementation(() => {
          return {
            lean: jest.fn().mockResolvedValue(userData),
          };
        }),
      };
    });

    mockIngredientModelFindById.mockImplementation(() => {
      return {
        lean: jest.fn().mockResolvedValue(ingredientData),
      };
    });

    mockIngredientModelFindOne.mockImplementation(() => {
      return {
        lean: jest.fn().mockResolvedValue(existedIngredient),
      };
    });

    await expect(Mutation.UpdateIngredient(null, { ingredient_input }, { userId: userData._id })).rejects.toThrowError(
      `${ingredient_input.name} is already existed`
    );

    expect(mockUserModelFindById).toHaveBeenCalledTimes(1);
    expect(mockIngredientModelFindById).toHaveBeenCalledTimes(1);
    expect(mockIngredientModelFindOne).toHaveBeenCalledTimes(1);
    expect(mockIngredientModelFindByIdAndUpdate).not.toHaveBeenCalled();
  });
});

describe('DeleteIngredient Mutation', () => {
  let mockUserModelFindById;
  let mockIngredientModelFindById;
  let mockRecipeModelFind;
  let mockIngredientModelFindByIdAndUpdate;

  // initiate before run each testing
  beforeEach(() => {
    // clear mock
    jest.clearAllMocks();

    // define mock for database
    mockUserModelFindById = jest.spyOn(UserModel, 'findById');
    mockIngredientModelFindById = jest.spyOn(IngredientModel, 'findById');
    mockRecipeModelFind = jest.spyOn(RecipeModel, 'find');
    mockIngredientModelFindByIdAndUpdate = jest.spyOn(IngredientModel, 'findByIdAndUpdate');
  });

  it('Should mark as deleted ingredient with id and specific user type', async () => {
    const userData = ingredientTestData.users[0];
    const ingredientData = ingredientTestData.ingredients[2];

    mockUserModelFindById.mockImplementation(() => {
      return {
        populate: jest.fn().mockImplementation(() => {
          return {
            lean: jest.fn().mockResolvedValue(userData),
          };
        }),
      };
    });

    mockIngredientModelFindById.mockImplementation(() => {
      return {
        lean: jest.fn().mockResolvedValue(ingredientData),
      };
    });

    mockRecipeModelFind.mockImplementation(() => {
      return {
        lean: jest.fn().mockResolvedValue([]),
      };
    });

    mockIngredientModelFindByIdAndUpdate.mockResolvedValue({
      ...ingredientData,
      status: 'deleted',
    });

    const deleteIngredientResult = await Mutation.DeleteIngredient(null, { _id: ingredientData._id }, { userId: userData._id });

    expect(mockUserModelFindById).toHaveBeenCalledTimes(1);
    expect(mockUserModelFindById).toHaveBeenCalledWith(userData._id);
    expect(mockIngredientModelFindById).toHaveBeenCalledTimes(1);
    expect(mockRecipeModelFind).toHaveBeenCalledTimes(1);
    expect(mockIngredientModelFindByIdAndUpdate).toHaveBeenCalledTimes(1);
    expect(deleteIngredientResult).toStrictEqual(`Ingredient ${ingredientData.name} is deleted`);
  });

  it('Should throw error if user type is not General Admin or Stock Admin', async () => {
    const userData = ingredientTestData.users[1];
    const ingredientData = ingredientTestData.ingredients[2];

    mockUserModelFindById.mockImplementation(() => {
      return {
        populate: jest.fn().mockImplementation(() => {
          return {
            lean: jest.fn().mockResolvedValue(userData),
          };
        }),
      };
    });

    await expect(Mutation.AddIngredient(null, { _id: ingredientData._id }, { userId: userData._id })).rejects.toThrowError(
      'Only General Admin or Stock Admin can add new ingredient'
    );

    expect(mockUserModelFindById).toHaveBeenCalledTimes(1);
    expect(mockIngredientModelFindById).not.toHaveBeenCalled();
    expect(mockRecipeModelFind).not.toHaveBeenCalled();
    expect(mockIngredientModelFindByIdAndUpdate).not.toHaveBeenCalled();
  });

  it('Should throw error if ingredient is in published recipe', async () => {
    const userData = ingredientTestData.users[0];
    const ingredientData = ingredientTestData.ingredients[1];
    const recipeData = ingredientTestData.recipe;

    mockUserModelFindById.mockImplementation(() => {
      return {
        populate: jest.fn().mockImplementation(() => {
          return {
            lean: jest.fn().mockResolvedValue(userData),
          };
        }),
      };
    });

    mockIngredientModelFindById.mockImplementation(() => {
      return {
        lean: jest.fn().mockResolvedValue(ingredientData),
      };
    });

    mockRecipeModelFind.mockImplementation(() => {
      return {
        lean: jest.fn().mockResolvedValue([recipeData]),
      };
    });

    await expect(Mutation.DeleteIngredient(null, { _id: ingredientData._id }, { userId: userData._id })).rejects.toThrowError(
      `Ingredient ${ingredientData.name} is used in published recipe`
    );

    expect(mockUserModelFindById).toHaveBeenCalledTimes(1);
    expect(mockIngredientModelFindById).toHaveBeenCalledTimes(1);
    expect(mockRecipeModelFind).toHaveBeenCalledTimes(1);
    expect(mockIngredientModelFindByIdAndUpdate).not.toHaveBeenCalled();
  });
});

// Query
describe('GetAllIngredients Query', () => {
  let mockIngredientModelModelAggregate;
  let pagination;

  beforeEach(() => {
    jest.resetAllMocks();
    mockIngredientModelModelAggregate = jest.spyOn(IngredientModel, 'aggregate');
    pagination = {
      limit: 5,
      page: 0,
    };
  });

  it('Should return ingredient data based on filter, sorting and pagination', async () => {
    const ingredientSortByStock = ingredientTestData.ingredients.sort((a, b) => a.stock_amount - b.stock_amount);

    mockIngredientModelModelAggregate.mockResolvedValue([
      {
        data: ingredientSortByStock,
        countData: [
          {
            _id: null,
            count: ingredientSortByStock.length,
          },
        ],
      },
    ]);

    const getAllIngredientsResult = await Query.GetAllIngredients(null, {
      filter: {
        is_available: 'yes',
      },
      sort: {
        stock_amount: 'asc',
      },
      pagination,
    });

    expect(mockIngredientModelModelAggregate).toHaveBeenCalledTimes(1);
    expect(getAllIngredientsResult).toEqual(ingredientSortByStock);
  });

  it('Should return ingredient data based on filter and pagination', async () => {
    let filteredIngredient = ingredientTestData.ingredients.filter((ingredient) => ingredient.name === 'Chicken');
    filteredIngredient.map((ingredient) => {
      ingredient.count_document = filteredIngredient.length;
    });

    mockIngredientModelModelAggregate.mockResolvedValue([
      {
        data: filteredIngredient,
        countData: [
          {
            _id: null,
            count: filteredIngredient.length,
          },
        ],
      },
    ]);

    const getAllIngredientsResult = await Query.GetAllIngredients(null, {
      filter: {
        name: 'Chicken',
      },
      sorting: null,
      pagination,
    });

    expect(mockIngredientModelModelAggregate).toHaveBeenCalledTimes(1);
    expect(getAllIngredientsResult).toEqual(filteredIngredient);
  });

  it('Should return ingredient data based on filter and sorting', async () => {
    let filteredIngredients = ingredientTestData.ingredients.filter((ingredient) => {
      const regex = /e/i;
      return regex.test(ingredient.name);
    });
    filteredIngredients.map((ingredient) => {
      ingredient.count_document = filteredIngredients.length;
    });
    filteredIngredients.sort((a, b) => a.name.localeCompare(b.name));
    filteredIngredients.reverse();

    mockIngredientModelModelAggregate.mockResolvedValue(filteredIngredients);

    const getAllIngredientsResult = await Query.GetAllIngredients(null, {
      filter: {
        name: 'e',
      },
      sorting: {
        name: 'desc',
      },
    });

    expect(mockIngredientModelModelAggregate).toHaveBeenCalledTimes(1);
    expect(getAllIngredientsResult).toEqual(filteredIngredients);
  });

  it('Should return ingredient data based on sorting and pagination', async () => {
    let ingredientSortByName = ingredientTestData.ingredients.sort((a, b) => a.name.localeCompare(b.name));
    ingredientSortByName.map((ingredient) => {
      ingredient.count_document = ingredientSortByName.length;
    });

    mockIngredientModelModelAggregate.mockResolvedValue([
      {
        data: ingredientSortByName,
        countData: [
          {
            _id: null,
            count: ingredientSortByName.length,
          },
        ],
      },
    ]);
    const getAllIngredientsResult = await Query.GetAllIngredients(null, {
      filter: null,
      sort: {
        name: 'asc',
      },
      pagination,
    });

    expect(mockIngredientModelModelAggregate).toHaveBeenCalledTimes(1);
    expect(getAllIngredientsResult).toEqual(ingredientSortByName);
  });

  it('Should return empty array if didn’t match with filter', async () => {
    mockIngredientModelModelAggregate.mockResolvedValue([]);

    const getAllIngredientsResult = await Query.GetAllIngredients(null, {
      filter: {
        name: randomstring.generate(5)
      }
    });

    expect(mockIngredientModelModelAggregate).toHaveBeenCalledTimes(1);
    expect(getAllIngredientsResult).toEqual([]);
  })

  it('Should return ingredient data with pagination only', async () => {
    const ingredients = ingredientTestData.ingredients
    mockIngredientModelModelAggregate.mockResolvedValue([{
      data: ingredients,
      countData: [{
        _id: null,
        count: ingredients.length
      }]
    }]);

    const getAllIngredientsResult = await Query.GetAllIngredients(null, {
      filter: null, sorting: null, pagination
    });

    expect(mockIngredientModelModelAggregate).toHaveBeenCalledTimes(1);
    expect(getAllIngredientsResult).toEqual(ingredients);
  })
});
