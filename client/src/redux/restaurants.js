import axios from 'axios'
import config from '../config'
import Promise from 'bluebird'
import { browserHistory } from 'react-router'


/* -----------------    ACTION TYPES    ------------------ */

const SET_CURRENT_RESTAURANT = "SET_CURRENT_RESTAURANT"
const SEARCH_CATEGORY = "SEARCH_CATEGORY"
const SEARCH_LOCATION = "SEARCH_LOCATION"
const FOUND_RESTAURANTS = "FOUND_RESTAURANTS"
const GET_MENU = "GET_MENU"
const GET_DISHES = "GET_DISHES"
const GET_FAVORITES = "GET_FAVORITES"
const SET_FOUND_RESTAURANT_INDEX = "SET_FOUND_RESTAURANT_INDEX"
const RESET_RESTAURANT_INDEX = "RESET_RESTAURANT_INDEX"


/* ------------     ACTION CREATORS      ------------------ */

export const setCurrentRestaurant = restaurant => ({type: SET_CURRENT_RESTAURANT, restaurant})
export const searchCategory = category => ({type: SEARCH_CATEGORY, category})
export const searchLocation = location => ({type: SEARCH_LOCATION, location})
export const foundRestaurants = restaurants => ({type: FOUND_RESTAURANTS, restaurants})
export const getMenu = menu => ({ type: GET_MENU, menu})
export const getDishes = dishes => ({type: GET_DISHES, dishes})
export const getFavorites = favorites => ({type: GET_FAVORITES, favorites})
export const setFoundRestaurantIndex = number => ({type: SET_FOUND_RESTAURANT_INDEX, number})
export const resetRestaurauntIndex = () => ({type: RESET_RESTAURANT_INDEX})


/* ------------          REDUCER         ------------------ */

export default function reducer (restaurants = {
  currentRestaurant: {},
  category: "",
  location: "",
  foundRestaurants: [],
  foundRestaurantIndex: 0,
  showRestaurants: [],
  menu: {},
  dishes: {},
  favorites: []
}, action) {
  switch (action.type) {
    case SET_CURRENT_RESTAURANT:
      return Object.assign({}, restaurants, {currentRestaurant: action.restaurant})
    case SEARCH_CATEGORY:
      return Object.assign({}, restaurants, {category: action.category})
    case SEARCH_LOCATION:
      return Object.assign({}, restaurants, {location: action.location})
    case FOUND_RESTAURANTS:
      return Object.assign({}, restaurants, {foundRestaurants: action.restaurants})
    case SET_FOUND_RESTAURANT_INDEX: 
      return Object.assign({}, restaurants, {foundRestaurantIndex: restaurants.foundRestaurantIndex + action.number,
      showRestaurants: restaurants.foundRestaurants.slice(restaurants.foundRestaurantIndex, restaurants.foundRestaurantIndex + 5)})
    case RESET_RESTAURANT_INDEX: 
      return  Object.assign({}, restaurants, {foundRestaurantIndex: 0, showRestaurants: restaurants.foundRestaurants.slice(0, 5)})
    case GET_MENU:
      return Object.assign({}, restaurants, {menu: action.menu})
    case GET_DISHES:
      return Object.assign({}, restaurants, {dishes: action.dishes})
    case GET_FAVORITES:
      return Object.assign({}, restaurants, {favorites: [...restaurants.favorites, action.favorites]})
    default:
      return restaurants;
  }
}

/* ------------       THUNK CREATORS     ------------------ */
export const favoriteDish = (terms) => (dispatch) => {
  const {dish, restaurant, currentUser} = terms 
  axios.post(`/api/user/${currentUser.id}/favorites`, {favorite: {dish_id: dish.id, restaurant_id: restaurant.id}})
  .then(res => dispatch(getFavorites(res.data)))
}

export const fetchFavorites = (currentUser) => dispatch => {
  axios.get(`/api/user/${currentUser.id}/favorites`)
  .then(favorites => dispatch(getFavorites(favorites.data)))
}

export const changeRestaurant = (restaurant_id) => dispatch => {
  axios.get(`/api/restaurant/${restaurant_id}`)
  .then(restaurant => {
    dispatch(setCurrentRestaurant(restaurant.data))
  })
}
 
export const fetchMenu = (id) => dispatch => {
  axios.get(`/api/restaurant/${id}/menu`)
  .then((menu) => {
    dispatch(getMenu(menu.data))
  })
}

export const searchMenus = (searchTerms) => dispatch => {
  const {category, location} = searchTerms
  axios.get(`https://spoonacular-recipe-food-nutrition-v1.p.mashape.com/recipes/search?cuisine=${category}&instructionsRequired=false&number=20`, {
    headers: {
      "X-Mashape-Key": config.MASHAPE_KEY,
      "X-Mashape-Host": "spoonacular-recipe-food-nutrition-v1.p.mashape.com"
    }
  }).then(res =>
    {return Promise.map(res.data.results, function(dish) {
      return axios.post('/api/dish', {dish: { name: dish.title, category: [category.toLowerCase()]}})
    })
    }).then(res => res.map(ele => ele.data))
    .then(dishes => dispatch(getDishes(dishes)))
}

export const searchRestaurants = (searchTerms, history) => dispatch => {
  const {category, location} = searchTerms 
  axios.post('/api/restaurant/yelp', {restaurant: {searchCat: category, searchLoc: location}})
  .then(result => {
    return Promise.map(result.data.businesses, (restaurant) => {
      const info = {
        name: restaurant.name,
        category: [category.toLowerCase(), restaurant.categories[0].title],
        yelp_url: restaurant.id,
        address: `${restaurant.location.address1}, ${restaurant.location.city}, ${restaurant.location.state} ${restaurant.location.zip_code}` ,
        latitude: restaurant.coordinates.latitude,
        longitude: restaurant.coordinates.longitude,
        price_range: restaurant.price,
        url: restaurant.url,
        featured_image: restaurant.image_url,
        user_rating: restaurant.rating,
        votes: restaurant.review_count,
        phone_numbers: restaurant.display_phone,
        transactions: restaurant.transactions
      }
      return axios.post('/api/restaurant', info)
    })
  })
  .then(restaurants => dispatch(foundRestaurants(restaurants.map(restaurant => restaurant.data))))
  .then(()=> dispatch(resetRestaurauntIndex()))
}
