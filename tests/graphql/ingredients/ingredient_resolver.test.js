/* eslint-disable no-undef */
require('dotenv').config();
const mongoose = require('mongoose');
const randomstring = require('randomstring');

const IngredientModel = require('../../../graphql/ingredients/ingredient.model');
const UserModel = require('../../../graphql/users/user.model');
const UserTypeModel = require('../../../graphql/userTypes/user_type.model');
const RecipeModel = require('../../../graphql/recipes/recipe.model');
const { Mutation } = require('../../../graphql/ingredients/ingredient.resolvers');

const ObjectId = mongoose.Types.ObjectId;
const ingredientTestData = require('./ingredient_test_data');

// MUTATION
describe('AddIngredient Mutation', () => {
  let mockUserFindById;
  let mockIngredientFindOne;
  let mockIngredientCreate;

  // initiate before run each testing
  beforeEach(() => {
    // clear mock
    jest.clearAllMocks();

    // define mock for database
    mockUserFindById = jest.spyOn(UserModel, 'findById');
    mockIngredientFindOne = jest.spyOn(IngredientModel, 'findOne');
    mockIngredientCreate = jest.spyOn(IngredientModel, 'create');
  });

  it('Should return new ingredient data with only specific user type and valid input', async () => {
    const ingredient_input = {
      name: randomstring.generate(9),
      stock_amount: 10,
    };
    const userData = ingredientTestData.users[0];

    mockUserFindById.mockImplementation(() => {
      return {
        populate: jest.fn().mockImplementation(() => {
          return {
            lean: jest.fn().mockResolvedValue(userData),
          };
        }),
      };
    });
    mockIngredientFindOne.mockImplementation(() => {
      return {
        lean: jest.fn().mockResolvedValue(null),
      };
    });

    mockIngredientCreate.mockResolvedValue({
      ...ingredient_input,
      _id: new ObjectId(),
      is_available: true,
    });
    const addIngredientResult = await Mutation.AddIngredient(null, { ingredient_input }, { userId: userData._id });

    expect(mockUserFindById).toHaveBeenCalledTimes(1);
    expect(mockIngredientFindOne).toHaveBeenCalledTimes(1);
    expect(mockIngredientCreate).toHaveBeenCalledTimes(1);

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

    mockUserFindById.mockImplementation(() => {
      return {
        populate: jest.fn().mockImplementation(() => {
          return {
            lean: jest.fn().mockResolvedValue(userData),
          };
        }),
      };
    });
    mockIngredientFindOne.mockImplementation(() => {
      return {
        lean: jest.fn().mockResolvedValue(null),
      };
    });

    mockIngredientCreate.mockResolvedValue({
      ...ingredient_input,
      _id: new ObjectId(),
      is_available: false,
    });
    const addIngredientResult = await Mutation.AddIngredient(null, { ingredient_input }, { userId: userData._id });

    expect(mockUserFindById).toHaveBeenCalledTimes(1);
    expect(mockIngredientFindOne).toHaveBeenCalledTimes(1);
    expect(mockIngredientCreate).toHaveBeenCalledTimes(1);

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

    mockUserFindById.mockImplementation(() => {
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

    expect(mockIngredientFindOne).not.toHaveBeenCalled();
    expect(mockIngredientCreate).not.toHaveBeenCalled();
  });

  it('Should throw error if ingredient name is null or empty', async () => {
    const userData = ingredientTestData.users[0];
    let ingredient_input = {
      stock_amount: 10,
    };

    mockUserFindById.mockImplementation(() => {
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

    expect(mockUserFindById).toHaveBeenCalledTimes(2);
    expect(mockIngredientFindOne).not.toHaveBeenCalled();
    expect(mockIngredientCreate).not.toHaveBeenCalled();
  });

  it('Should throw error if ingredient name is already existed', async () => {
    const userData = ingredientTestData.users[0];
    const ingredientData = ingredientTestData.ingredients[0];
    const ingredient_input = {
      name: ingredientData.name,
      stock_amount: 10,
    };

    mockUserFindById.mockImplementation(() => {
      return {
        populate: jest.fn().mockImplementation(() => {
          return {
            lean: jest.fn().mockResolvedValue(userData),
          };
        }),
      };
    });
    mockIngredientFindOne.mockImplementation(() => {
      return {
        lean: jest.fn().mockResolvedValue(ingredientData),
      };
    });

    await expect(Mutation.AddIngredient(null, { ingredient_input }, { userId: userData._id })).rejects.toThrowError(
      `${ingredient_input.name} is already existed`
    );

    expect(mockUserFindById).toHaveBeenCalledTimes(1);
    expect(mockIngredientFindOne).toHaveBeenCalledTimes(1);
    expect(mockIngredientCreate).not.toHaveBeenCalled();
  });
});

describe('UpdateIngredient Mutation', () => {
  let mockUserFindById;
  let mockIngredientFindById;
  let mockIngredientFindOne;
  let mockIngredientFindByIdAndUpdate;

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
    mockUserFindById = jest.spyOn(UserModel, 'findById');
    mockIngredientFindById = jest.spyOn(IngredientModel, 'findById');
    mockIngredientFindOne = jest.spyOn(IngredientModel, 'findOne');
    mockIngredientFindByIdAndUpdate = jest.spyOn(IngredientModel, 'findByIdAndUpdate');
  });

  it('Should return updated ingredient with id, valid input, and specific usertype', async () => {
    const ingredientData = ingredientTestData.ingredients[1];
    const userData = ingredientTestData.users[0];
    const ingredient_input = {
      name: randomstring.generate(9),
      stock_amount: 0,
    };

    mockUserFindById.mockImplementation(() => {
      return {
        populate: jest.fn().mockImplementation(() => {
          return {
            lean: jest.fn().mockResolvedValue(userData),
          };
        }),
      };
    });

    mockIngredientFindById.mockImplementation(() => {
      return {
        lean: jest.fn().mockResolvedValue(ingredientData),
      };
    });

    mockIngredientFindOne.mockImplementation(() => {
      return {
        lean: jest.fn().mockResolvedValue(null),
      };
    });

    mockIngredientFindByIdAndUpdate.mockResolvedValue({
      ...ingredientData,
      name: ingredient_input.name,
      stock_amount: ingredient_input.stock_amount,
      is_available: false,
    });
    const updateIngredientResult = await Mutation.UpdateIngredient(null, { ingredient_input }, { userId: userData._id });

    expect(mockUserFindById).toHaveBeenCalledTimes(1);
    expect(mockIngredientFindById).toHaveBeenCalledTimes(1);
    expect(mockIngredientFindOne).toHaveBeenCalledTimes(1);
    expect(mockIngredientFindByIdAndUpdate).toHaveBeenCalledTimes(1);

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

    mockUserFindById.mockImplementation(() => {
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

    expect(mockUserFindById).toHaveBeenCalledTimes(1);
    expect(mockIngredientFindById).not.toHaveBeenCalled();
    expect(mockIngredientFindOne).not.toHaveBeenCalled();
    expect(mockIngredientFindByIdAndUpdate).not.toHaveBeenCalled();
  });

  it('Should throw error if ingredient name is already existed', async () => {
    const userData = ingredientTestData.users[0];
    const ingredientData = ingredientTestData.ingredients[1];
    const existedIngredient = ingredientTestData.ingredients[0];
    const ingredient_input = {
      name: existedIngredient.name,
    };

    mockUserFindById.mockImplementation(() => {
      return {
        populate: jest.fn().mockImplementation(() => {
          return {
            lean: jest.fn().mockResolvedValue(userData),
          };
        }),
      };
    });

    mockIngredientFindById.mockImplementation(() => {
      return {
        lean: jest.fn().mockResolvedValue(ingredientData),
      };
    });

    mockIngredientFindOne.mockImplementation(() => {
      return {
        lean: jest.fn().mockResolvedValue(existedIngredient),
      };
    });

    await expect(Mutation.UpdateIngredient(null, { ingredient_input }, { userId: userData._id })).rejects.toThrowError(
      `${ingredient_input.name} is already existed`
    );

    expect(mockUserFindById).toHaveBeenCalledTimes(1);
    expect(mockIngredientFindById).toHaveBeenCalledTimes(1);
    expect(mockIngredientFindOne).toHaveBeenCalledTimes(1);
    expect(mockIngredientFindByIdAndUpdate).not.toHaveBeenCalled();
  });
});

describe('DeleteIngredient Mutation', () => {
  let mockUserFindById;
  let mockIngredientFindById;
  let mockRecipeFind;
  let mockIngredientFindByIdAndUpdate;

  // initiate before run each testing
  beforeEach(() => {
    // clear mock
    jest.clearAllMocks();

    // define mock for database
    mockUserFindById = jest.spyOn(UserModel, 'findById');
    mockIngredientFindById = jest.spyOn(IngredientModel, 'findById');
    mockRecipeFind = jest.spyOn(RecipeModel, 'find');
    mockIngredientFindByIdAndUpdate = jest.spyOn(IngredientModel, 'findByIdAndUpdate');
  });

  it('Should mark as deleted ingredient with id and specific user type', async () => {
    const userData = ingredientTestData.users[0];
    const ingredientData = ingredientTestData.ingredients[2];

    mockUserFindById.mockImplementation(() => {
      return {
        populate: jest.fn().mockImplementation(() => {
          return {
            lean: jest.fn().mockResolvedValue(userData),
          };
        }),
      };
    });

    mockIngredientFindById.mockImplementation(() => {
      return {
        lean: jest.fn().mockResolvedValue(ingredientData),
      };
    });

    mockRecipeFind.mockImplementation(() => {
      return {
        lean: jest.fn().mockResolvedValue([]),
      };
    });

    mockIngredientFindByIdAndUpdate.mockResolvedValue({
      ...ingredientData,
      status: 'deleted',
    });

    const deleteIngredientResult = await Mutation.DeleteIngredient(null, { _id: ingredientData._id }, { userId: userData._id });

    expect(mockUserFindById).toHaveBeenCalledTimes(1);
    expect(mockUserFindById).toHaveBeenCalledWith(userData._id);
    expect(mockIngredientFindById).toHaveBeenCalledTimes(1);
    expect(mockRecipeFind).toHaveBeenCalledTimes(1);
    expect(mockIngredientFindByIdAndUpdate).toHaveBeenCalledTimes(1);
    expect(deleteIngredientResult).toStrictEqual(`Ingredient ${ingredientData.name} is deleted`);
  });

  it('Should throw error if user type is not General Admin or Stock Admin', async () => {
    const userData = ingredientTestData.users[1];
    const ingredientData = ingredientTestData.ingredients[2];

    mockUserFindById.mockImplementation(() => {
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

    expect(mockUserFindById).toHaveBeenCalledTimes(1);
    expect(mockIngredientFindById).not.toHaveBeenCalled();
    expect(mockRecipeFind).not.toHaveBeenCalled();
    expect(mockIngredientFindByIdAndUpdate).not.toHaveBeenCalled();
  });

  it('Should throw error if ingredient is in published recipe', async () => {
    const userData = ingredientTestData.users[0];
    const ingredientData = ingredientTestData.ingredients[1];
    const recipeData = ingredientTestData.recipe;

    mockUserFindById.mockImplementation(() => {
      return {
        populate: jest.fn().mockImplementation(() => {
          return {
            lean: jest.fn().mockResolvedValue(userData),
          };
        }),
      };
    });

    mockIngredientFindById.mockImplementation(() => {
      return {
        lean: jest.fn().mockResolvedValue(ingredientData),
      };
    });

    mockRecipeFind.mockImplementation(() => {
      return {
        lean: jest.fn().mockResolvedValue([recipeData]),
      };
    });

    await expect(Mutation.DeleteIngredient(null, { _id: ingredientData._id }, { userId: userData._id })).rejects.toThrowError(
      `Ingredient ${ingredientData.name} is used in published recipe`
    );

    expect(mockUserFindById).toHaveBeenCalledTimes(1);
    expect(mockIngredientFindById).toHaveBeenCalledTimes(1);
    expect(mockRecipeFind).toHaveBeenCalledTimes(1);
    expect(mockIngredientFindByIdAndUpdate).not.toHaveBeenCalled();
  });
});
