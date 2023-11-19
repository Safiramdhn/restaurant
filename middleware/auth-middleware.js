const { AuthenticationError } = require('apollo-server-express');
const {getUserId} = require('../utils/common');

const requireAuthJwt = async (resolver, parent, args, ctx, info) => {
    const auth = ctx.req.get('Authorization');
    if(!auth) throw new AuthenticationError('Authorization header is missing');

    let token = auth.replace('Bearer ', '');
    let userId = getUserId(token);
    const user = await UserModel.findById(userId).lean()

    if(!user) throw new AuthenticationError('Unauthorization');

    ctx.userId = user
    return resolver()
};

let authMiddleware = {
    Query: {
        GetAllUserTypes: requireAuthJwt
    }
}

module.exports = authMiddleware