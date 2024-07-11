/* eslint-disable no-undef */
require('dotenv').config();
const mongoose = require('mongoose');
const randomstring = require('randomstring');

const IngredientModel = require('../../../graphql/ingredients/ingredient.model');
const UserModel = require('../../../graphql/users/user.model');
const UserTypeModel = require('../../../graphql/userTypes/user_type.model');
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
    const ingredient_input = {
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
      `${ingredient_input.name} already existed`
    );

    expect(mockUserFindById).toHaveBeenCalledTimes(1);
    expect(mockIngredientFindOne).toHaveBeenCalledTimes(1);
    expect(mockIngredientCreate).not.toHaveBeenCalled();
  });
});

