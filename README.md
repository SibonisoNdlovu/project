# Technical information

Please create a .env file and add key sent via email

It took me just over three hours to complete this project, mainly due to issues with configuring Jest. However, I did manage to add one or two tests to meet the requirement. The implementation time does not include the planning I did beforehand, which involved jotting down some wireframes and reading up on SWR, which I used for caching.

I started by creating a folder structure that I prefer, keeping in mind not to overcomplicate things since this is a mini-project. Then, I created all the relevant files I knew I would need from the beginning.

I built the components: AnimalCard and Button, and created the page necessary to display everything.

After that, I developed a mini site with mock data and worked on the UI before implementing the hook to fetch data from API Ninjas.

Once I sorted out the UI, I implemented the hook and linked everything up. Local storage was the last feature I added to store data, followed by some tests.

I wanted to include a modal to display all the attributes, but I ran out of time, so I only displayed the top 5, as the list was quite long.

I had planned to implement more tests, but I didn't have enough time.

The images folder has some example of the solution running


# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can’t go back!**

If you aren’t satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you’re on your own.

You don’t have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn’t feel obligated to use this feature. However we understand that this tool wouldn’t be useful if you couldn’t customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).
