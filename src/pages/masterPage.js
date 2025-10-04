// For full API documentation, including code examples, visit https://wix.to/94BuAAs

$w.onReady(function () {
	//TODO: write your page related code here...

  // get the current item from the dataset
  const currentItem = $w("#dataset1").getCurrentItem();

  // get the current average rating, number of ratings, and
  //total ratings for the current dataset item
  const average = currentItem.avg;
  const count = currentItem.numRatings;
  const total = currentItem.totalRatings;

  // get the new rating from the ratings input
  const newRating = $w('#ratingsInput1').value;

  // calculate the new average rating based on the current
  //average and count
  const newAverageLong = (total + newRating) / (count +1);
  // Round the average rating to 1 decimal point
  const newAverageShort =                                             Number.parseFloat(newAverageLong).toFixed(1);

  // set the dataset fields to the new average, total
  // ratings, and number of ratings
  $w('#dataset1').setFieldValues({
   'avg': newAverageShort,
   'totalRatings': total + newRating,
   'numRatings': (count + 1)
  });
  
  // save the dataset fields to the collection
  $w('#dataset1').save()
   .catch((err) => {
    console.log('could not save new rating');
   });
 });