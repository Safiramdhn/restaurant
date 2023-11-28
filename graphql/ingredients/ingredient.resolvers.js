const IngredientModel = require('./ingredient.model');
const UserModel = require('../users/user.model');
const UserTypes = require('../userTypes/user_type.model');

//****Query */

const GetAllIngredients = async (parent) => {
  const ingredients = await IngredientModel.find({
    status: 'active',
  }).lean();

  return ingredients;
};

const GetOneIngredient = async (parent, { _id }) => {
  const ingredient = await IngredientModel.findOne({ _id, status: 'active' }).lean();
  return ingredient;
};

//****Mutation */
const AddIngredient = async (parent, { ingredient_input }, ctx) => {
  const userLogin = await UserModel.findById(ctx.userId).populate([{path: 'user_type', select: 'name'}]).lean();
  if(userLogin.user_type.name !== 'Stock Admin') throw new Error('Only Stock Admin can add new ingredient');

  if (!ingredient_input.name) {
    throw new Error('Ingredient must have a name');
  } else {
    const existedIngredient = await IngredientModel.findOne({
      name: ingredient_input.name,
    }).lean();
    if (existedIngredient) throw new Error('Ingredient name already existed');
  }

  const ingredient = await IngredientModel.create(ingredient_input);
  return ingredient;
};

const UpdateIngredient = async (parent, {_id, ingredient_input}, ctx) {
  const userLogin = await UserModel.findById(ctx.userId).populate([{path: 'user_type', select: 'name'}]).lean();
  if(userLogin.user_type.name !== 'Stock Admin') throw new Error('Only Stock Admin can edit the ingredient');

  const oldIngredientData = await IngredientModel.findById(_id).lean();
  if(ingredient_input.name !== oldIngredientData.name) {
    const existedIngredient = await IngredientModel.find({
      name: ingredient_input.name,
    }).lean();
    if (existedIngredient) throw new Error('Ingredient name already existed');
  }

  const updateIngredient = await IngredientModel.findByIdAndUpdate(_id, {$set: ingredient_input}, {new: true});
  return updateIngredient
}

const DeleteIngredient = async (parent, {_id}, ctx) => {
  const userLogin = await UserModel.findById(ctx.userId).populate([{path: 'user_type', select: 'name'}]).lean();
  if(userLogin.user_type.name !== 'Stock Admin') throw new Error('Only Stock Admin can delete the ingredient');
  
  // if ingredient was used in published recipes then don't delete it

  const ingredient = await IngredientModel.findByIdAndUpdate(_id, {$set: {
    status: 'deleted'
  }}).lean();

  return `Ingredient ${ingredient.name} is deleted`;
}

module.exports = {
  Query: {
    GetAllIngredients,
    GetOneIngredient,
  },
  Mutation: {
    AddIngredient,
    UpdateIngredient,
    DeleteIngredient
  },
};
