function slugify(text) {
  return text.toString().toLowerCase()
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
    .replace(/\-\-+/g, '-')         // Replace multiple - with single -
    .replace(/^-+/, '')             // Trim - from start of text
    .replace(/-+$/, '');            // Trim - from end of text
}

function lowerCase(text) {
  return text.toLowerCase();
}

function upperCase(text) {
  return text.toUpperCase();
}

function capitalizeFirstLetter(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function titleCase(str) {
  return str.replace(/\w\S*/g, function(txt){
      return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
  });
}

export function getSearchFilter(searchText, userId, postType) {
  if(userId && postType) {
    return {
      FilterExpression: "postType = :postType AND userId = :userId AND (contains(postId, :postId) OR contains(content, :lowercase) OR contains(content, :capitalize) OR contains(content, :titlecase) OR contains(music, :titlecase) OR contains(singers, :titlecase) OR contains(category, :uppercase))",
      ExpressionAttributeValues: {
        ":postType": postType,
        ":userId": userId,
        ":postId": slugify(searchText),
        ":lowercase": lowerCase(searchText),
        ":capitalize": capitalizeFirstLetter(searchText),
        ":titlecase": titleCase(searchText),
        ":uppercase": upperCase(searchText)
      }
    };
  } else if(postType) {
    return {
      FilterExpression: "postType = :postType AND (contains(postId, :postId) OR contains(content, :lowercase) OR contains(content, :capitalize) OR contains(content, :titlecase) OR contains(music, :titlecase) OR contains(singers, :titlecase) OR contains(category, :uppercase))",
      ExpressionAttributeValues: {
        ":postType": postType,
        ":postId": slugify(searchText),
        ":lowercase": lowerCase(searchText),
        ":capitalize": capitalizeFirstLetter(searchText),
        ":titlecase": titleCase(searchText),
        ":uppercase": upperCase(searchText)
      }
    };
  } else {
    return {
      FilterExpression: "contains(postId, :postId) OR contains(content, :lowercase) OR contains(content, :capitalize) OR contains(content, :titlecase) OR contains(music, :titlecase) OR contains(singers, :titlecase) OR contains(category, :uppercase)",
      ExpressionAttributeValues: {
        ":postId": slugify(searchText),
        ":lowercase": lowerCase(searchText),
        ":capitalize": capitalizeFirstLetter(searchText),
        ":titlecase": titleCase(searchText),
        ":uppercase": upperCase(searchText)
      }
    };
  }
}