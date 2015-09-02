
/* global document, window, io */

$(document).ready(initialize);

var app_id = "8f303a51";
var app_key = "aff06d00c9a604466f6f1cd0e42927c7";
var apiBase = "https://api.yummly.com/v1/api";
var authentication = "_app_id=" + app_id + "&_app_key=" + app_key;
var recipes = [];
var matches;
var shoppingList = [];

function initialize(){
  $(document).foundation();
  $('#searchButton').on('click',clickSearch);
  $('#searchMatches').on('click','li',clickRecipe);
  $('#openLinksButton').on('click',clickOpenLinks);
  $('#chosenRecipes').on('click','.alert',clickDeleteChosenRecipe);
  $('#groceryList').on('click','.alert', clickDeleteIngredient);
  $('body').on('keydown', keypressMove);
}

function clickSearch(){
  matches = [];
  $('#searchMatches').empty();
  var searchTerm = getValue('#searchTerm');
  searchTerm = searchTerm.replace(/ /g, '+');
  var url = apiBase + "/recipes?" + authentication + "&q=" + searchTerm;
  var goodMatches = false;
  $.ajax({type: "GET", url: url, dataType: "jsonp", success: function (data) {
      for(var i = 0 ; i < data.matches.length; i++){
        var sz = "90";
        var pic;
        if(data.matches[i].imageUrlsBySize){
          pic = data.matches[i].imageUrlsBySize[sz];
          var $li = $('<li data_id = ' + data.matches[i].id + '>' + '<img src=' + pic + '>' + '<div>' + data.matches[i].recipeName + '</div>' + '</li>');
          $('#searchMatches').append($li);
          goodMatches = true;
        }
      }
      matches = data.matches;
      if(goodMatches){
        $('#searchMatches').show().removeClass('hidden');
        $('#searchTerm').focus();
      }
      else{
        alert('Sorry no matches found.  Please try a different search.');
        $('#searchTerm').focus();
        $('body').on('keydown', keypressMove);
      }
    }
  });
}

function clickRecipe(){
  $('#searchMatches').hide().addClass('hidden');
  $('#list').show().removeClass('hidden');
  $('#choose').show().removeClass('hidden');
 // push ingredients to shopping list from matches array local
  var id = $(this).attr('data_id');
  var recipeResponse = _.find(matches, function(item){
    return item.id == id;
  });
  var clickedRecipe = {};
  clickedRecipe.ingredients = recipeResponse.ingredients;
  clickedRecipe.name = recipeResponse.recipeName;

  var url = apiBase + "/recipe/" + id + "?" + authentication;
  $.ajax({type: "GET", url: url, dataType: "jsonp", success: function (data) {
      clickedRecipe.id = data.id;
      clickedRecipe.link = data.source.sourceRecipeUrl;
      clickedRecipe.measuredIngredients = data.ingredientLines;
      recipes.push(clickedRecipe);
      var sz = "90";
      var $clickedRecipe = $('<li>');
      $clickedRecipe.attr('data-id',clickedRecipe.id);

      $clickedRecipe.append('<a href=' + clickedRecipe.link + ' target="_blank"' + '>' + '<img src=' + recipeResponse.imageUrlsBySize[sz] + '>' + '</a>' + '<a href=' + clickedRecipe.link + ' target="_blank">' + clickedRecipe.name + '</a>');
 // add delete button for each item you put in
      var $delete = $('<input type="button" value="x" class="button tiny radius alert" >');
      $clickedRecipe.append($delete);
      $('#chosenRecipes').append($clickedRecipe);
      $('#searchMatches').empty();
      $('#searchTerm').focus();
      $('body').on('keydown', keypressMove);
      $('#openLinksButton').show().removeClass('hidden');
      clickPrint();
    }
  });
}

function clickDeleteChosenRecipe(){
  var id = $(this).closest('li').attr('data-id');
  // remove from html
  $(this).closest('li').remove();
  // remove from recipes array
  _.remove(recipes, function(r){
    return r.id == id;
  });
  clickPrint();
  if(recipes.length === 0){
    $('#openLinksButton').hide().addClass('hidden');
    $('#list').hide().addClass('hidden');
    $('#choose').hide().addClass('hidden');
    $('#searchTerm').focus();
    $('body').on('keydown', keypressMove);
  }
}

function clickPrint(){
  var list = [];
  $('#groceryList').empty();
  _.forEach(recipes, function(r){
    // go through every recipe
      // go trhough every indreg
        // if it is already in list add regexed amount
        // else add it to list with ingred and amount
    _.forEach(r.ingredients, function(ingred){
      var found = false;
      var re = new RegExp(' ' + ingred, 'g');
      var measuredIngred;
      _.forEach(list, function(item){
        if(ingred == item.ingredient){
          _.forEach(r.measuredIngredients, function(mIngred){
            if(mIngred.indexOf(' ' + ingred) != -1){
              measuredIngred = mIngred.replace(re,'')
              item.amounts.push(measuredIngred);
              found = true;
            }
          });
        }
      });
      if(!found){
        item = {};
        item.ingredient = ingred;
        item.amounts = [];
        _.forEach(r.measuredIngredients, function(mIngred){
          if(mIngred.indexOf(' ' + ingred) != -1){
            measuredIngred = mIngred.replace(re,'');
            item.amounts.push(measuredIngred);
          }
        });
        list.push(item);
        // var list = [{'ingredient': 'wheat'},{'ingredient': 'a'},{'ingredient': 'f'},];
        list = _.sortBy(list, 'ingredient');
      }
    });
  });
  _.forEach(list, function(item){
      var $li = $('<li>');
      var $ingredient = $('<span>');
      $ingredient.text(item.ingredient);
      $ingredient.addClass('match');
      var $amounts = $('<span>');
      $amounts.addClass('amount');
      _.forEach(item.amounts, function(a){
        var $amount = $('<span>');
        $amount.text('[' + a + ']');
        $amounts.append($amount);
      });

      var $delete = $('<input type="button" value="x" class="button tiny radius alert" >');
      var $writing = $('<span>');
      $writing.addClass('writing');
      $writing.append($ingredient, $amounts);
      $li.append($delete, $writing);
      $('#groceryList').append($li);
  });
}

function clickOpenLinks(){
  _.forEach(recipes, function(r){
    window.open(r.link,'_blank');
  });
}

function clickDeleteIngredient(){
  // remove from html
  if($(this).closest('li').siblings().length == 0){
    $('#list').hide().addClass('hidden');
  }
  $(this).closest('li').remove();
}
///////////////////////////////////////////////////////////////////////////

function keypressMove(e){
  if(e.keyCode === 13 && $('#searchTerm').is(':focus')){
    clickSearch();
  }
}
