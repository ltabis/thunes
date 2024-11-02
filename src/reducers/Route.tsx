
type Action = { type: "push", route: string };

function routeReducer(action: Action): string {
    switch (action.type) {
        case 'push': {
            return action.route;
        }
        default: {
            throw Error('Unknown action: ' + action.type);
        }
    }
}