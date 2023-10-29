const { gql } = require('graphql');

const UserTypeTypedef = gql`
    type UserType {
        _id: ID
        name: String
        app_permission: UserTypePermissions
    }

    type UserTypePermissions {
        homepage: Boolean
        ingredients: IngredientPermission
        recipes: RecipePermission
        transaction: TransactionPermission
        users: UserPermission
    }

    type IngredientPermission {
        view: Boolean
        edit: Boolean
        add_button: Boolean,
        delete: Boolean
    }

    type RecipePermission {
        view: Boolean
        edit: Boolean
        add_button: Boolean
        delete: Boolean
        publish: Boolean
    }

    type TransactionPermission {
        view: TransactionView
        edit: Boolean
        add_button: Boolean
        delete: Boolean
    }

    type TransactionView {
        history: Boolean
        cart: Boolean
    }

    type UserPermission {
        view: Boolean
        edit: Boolean
        add_button: Boolean,
        delete: Boolean
    }

    type extend Query {
        GetAllUserTypes : [UserType]
        GetOneUserType(_id: ID) : UserType
    }
`;

module.exports = UserTypeTypedef;
