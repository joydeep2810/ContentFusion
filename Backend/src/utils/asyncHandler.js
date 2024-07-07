//Async Handler is a wrapper function we use to handle all the async fn so that we dont have to write the async try catch block again and again
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch((err) => {
      next(err);
    });
  };
};

export default asyncHandler;
