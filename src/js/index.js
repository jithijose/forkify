import Search from './models/Search';
import Recipe from './models/Recipe';
import List from './models/List';
import Likes from './models/Likes';
import * as searchView from './views/searchView';
import * as recipeView from './views/recipeView';
import * as listView from './views/listView';
import * as likesView from './views/likesView';
import { elements, renderLoader, clearLoader } from './views/base';

/*  Gllobal state of the app
* - Search Object
* - Current recipe object
* - Shopping list object
* - Liked recipes
*/
const state = {};

/*
*  SEARCH CONTROLLER
*/
const controlSearch = async () => {
    // 1. Get the query from the view
    const query = searchView.getInput();

    if (query) {
        // 2. New search object and add to state
        state.search = new Search(query);

        // 3. prepare UI for the results
        searchView.clearInput();
        searchView.clearResults();
        renderLoader(elements.searchRes);

        try {
            // 4. searach for recipes
            await state.search.getResults();

            // 5. Render results on UI
            clearLoader();
            searchView.renderResults(state.search.result);
        } catch (error) {
            alert('Something wrong with the search...');
            clearLoader();
        }

    }
}

elements.searchForm.addEventListener('submit', e => {
    e.preventDefault();
    controlSearch();
});

elements.searchResPages.addEventListener('click', e => {
    var btn = e.target.closest('.btn-inline');
    if (btn) {
        const goToPage = parseInt(btn.dataset.goto);
        searchView.clearResults();
        searchView.renderResults(state.search.result, goToPage);
    }

});

/*
*  RECIPE CONTROLLER
*/
const controlRecipe = async () => {
    // Get the ID from the URL
    const id = window.location.hash.replace('#', '');

    if (id) {
        // 1. prepare the UI for the recipe
        recipeView.clearRecipe();
        renderLoader(elements.recipe);

        // HIghlight selected search item

        if (state.search) searchView.highlightSelected(id);

        // 2. Create new recipe object
        state.recipe = new Recipe(id);

        try {
            // 3. Get the recipe data
            await state.recipe.getRecipe();
            state.recipe.parseIngredients();

            // 4. Calculate the servinsg and time
            state.recipe.calcTime();
            state.recipe.calcServings();

            // 5. Render the recipe
            clearLoader();
            recipeView.renderRecipe(
                state.recipe,
                state.likes.isLiked(id));
        } catch (error) {
            console.log(error);
            alert('Error in processing recipe!!');
        }

    }
};


['hashchange', 'load'].forEach(event => window.addEventListener(event, controlRecipe));

/**
* LIST CONTROLLER 
* 
*/

const controlList = () =>{
    // create a new list if there in none yet
    if(!state.list) state.list = new List();

    // Add each ingredient to the list
    state.recipe.ingredients.forEach(el => {
        const item = state.list.addItem(el.count, el.unit, el.ingredient);
        listView.renderItem(item);
    });

};

// Handle delete and update list items events
elements.shopping.addEventListener('click', e => {
    const id = e.target.closest('.shopping__item').dataset.itemid;

    // handle delete event
    if (e.target.matches('.shopping__delete, .shopping__delete *')){
        // delete from state
        state.list.deleteItem(id);

        // delete from user interface
        listView.deleteItem(id);

    }else if (e.target.matches('.shopping__count-value')) {
        
        // Handle the count update
        const val = parseFloat(e.target.value, 10);
        //console.log(`count updates: ${val}`);
        state.list.updateCount(id, val);
    }
});

/**
* LIKES CONTROLLER 
* 
*/
const controlLike = () => {
    // create a new likes if there in none yet
    if(!state.likes) state.likes = new Likes();

    const currentID = state.recipe.id;
    
    // User has not yet liked current recipe
    if (!state.likes.isLiked(currentID)){
        // add the like to state
        const newLike = state.likes.addLike(
            currentID,
            state.recipe.title,
            state.recipe.author,
            state.recipe.img
        );

        // toggle the like button
        likesView.toggleLikeBtn(true);

        // Add the like to UI list
        likesView.renderLike(newLike);

        // User has liked the recipe
    }else {
        // remove the like from the state
        state.likes.deleteLike(currentID);

        // toggle the like button
        likesView.toggleLikeBtn(false);

        // remove the like from UI list
        likesView.deleteLike(currentID);
    }

    likesView.toggleLikeMenu(state.likes.getNumLikes());
}

// restore like recipe on page load
window.addEventListener('load', () => {
    state.likes = new Likes();
    
    // restore likes
    state.likes.readStorage();

    // toggle ike menu button
    likesView.toggleLikeMenu(state.likes.getNumLikes());

    // render the existing likes
    state.likes.likes.forEach(like => likesView.renderLike(like));

})

// handling recipe button clicks
elements.recipe.addEventListener('click', e => {
    if (e.target.matches('.btn-decrease, .btn-decrease *')) {
        // Decrease button clicked
        if (state.recipe.servings > 1) {
            state.recipe.updateServings('dec');
            recipeView.updateServingsIngredients(state.recipe);
        }
    } else if (e.target.matches('.btn-increase, .btn-increase *')) {
        // increase button clicked
        state.recipe.updateServings('inc');
        recipeView.updateServingsIngredients(state.recipe);
    } else if (e.target.matches('.recipe__btn--add, .recipe__btn--add *')) {
        //Add ingredients to shopping list
        controlList();
    }else if (e.target.matches('.recipe__love, .recipe__love *')) {
        // Like Controller
        controlLike();
    }
});
