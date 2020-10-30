//gets the packages required for electron js and other stuff
const {app, BrowserWindow, Menu, ipcMain, shell} = require('electron');

const path = require('path');
const os = require('os');
const imagemin = require('imagemin');
const imageminMozjpeg = require('imagemin-mozjpeg');
const imageminPngquant = require('imagemin-pngquant');
const slash = require('slash');


//sets the environment to development
process.env.NODE_ENV = 'production';

//assigns the variable isDev a boolean value based on the environment
const isDev = process.env.NODE_ENV !== 'production' ? true : false;

//assigns the variable isMac a boolean value based on the platform being used by the user.
const isMac = process.platform === 'darwin' ? true : false;

//prints if the environment is true or false.
console.log(isDev);

//assigns a variable for the main window which is going to be used for the GUI and the handeling of the application by the user.
let mainWindow;

//assigns a variable for the about window which is going to be used for the about section of the application.
let aboutWindow;

//a function which creates the main window according to the developers configuration.
function createMainWindow() {
    //assigns the main window variable to a object of the BrowserWindow class.
    mainWindow = new BrowserWindow({
        //set's the title of the application.
        title: 'ImageShrink',
        //sets the width of the application window.
        width: 500,
        //sets the height of the application window.
        height: 600,
        //sets the icon of the application window.
        icon: `${__dirname}/assets/icons/Icon_256x256.png`,
        //sets the resize mode of the application window
        resizable: isDev,
        //Configuration for integrating node and web preferences
        webPreferences: { 
            worldSafeExecuteJavaScript: true,
            nodeIntegration: true
        }
    })
    //This loads the file that will be used as the GUI and the template of the HTML file.
    mainWindow.loadFile(`./app/index.html`)
}

//a function which creates the about window according to the developers configuration.
function createAboutWindow() {
    //assigns the main window variable to a object of the BrowserWindow class.
    aboutWindow = new BrowserWindow({
        //set's the title of the application.
        title: 'About ImageShrink',
        //sets the width of the application window.
        width: 300,
        //sets the height of the application window.
        height: 300,
        //sets the icon of the application window.
        icon: `${__dirname}/assets/icons/Icon_256x256.png`,
        //sets the resize mode of the application window
        resizable: false,
        //I dont know the use of this object.
        webPreferences: { 
            worldSafeExecuteJavaScript: true
        }
    })
    //This loads the file that will be used as the GUI and the template of the HTML file.
    aboutWindow.loadFile(`./app/about.html`)
}

//The variable menu is an array which stores the task bar menu configuration options.
const menu = [
    ...(isMac ? [{
        label: app.name,
        submenu: [{
            label: 'About',
            click: createAboutWindow
        }]
    }] : []),
    {
        role: 'fileMenu'
    },
    ...(isDev ? [
            { 
                label: 'Developer', 
                submenu: [
                    { role: 'reload'},
                    { role: 'forcereload'}, 
                    { type: 'separator' },
                    { role: 'toggledevtools'}
                ] 
            } 
        ] : 
    []),
    ...(!isMac ? [{
        label: 'Help',
        submenu: [{
            label: 'About',
            click: createAboutWindow
        }]
    }] : [])
];

ipcMain.on('image:minimize', (event, options) => {
    options.dest = path.join(os.homedir(), 'imageshrink');
    shrinkImage(options);
})

async function shrinkImage({imgPath, quality, dest}){
    try {
        const pngQuality = quality / 100;
        const files = await imagemin([slash(imgPath)], {
            destination: dest,
            plugins: [
                imageminMozjpeg({ quality }),
                imageminPngquant({
                    quality: [pngQuality, pngQuality]
                })
            ]
        })
        console.log(files);
        shell.openPath(dest);
        mainWindow.webContents.send("image:done");
    } catch (error) {
        console.log(error);
    }
}

//This is called when the app is ready to run.
app.on('ready' ,() => {
    //calls the main function with all of the configuration of the main window.
    createMainWindow();
    //The variable mainMenu is assigned the return value from the class Menu to build the custom menu required by the developer.
    const mainMenu = Menu.buildFromTemplate(menu);
    //This set's the application menu to the mainMenu variable created.
    Menu.setApplicationMenu(mainMenu)
    //This checks if the mainWindow is closed then the value of the MainWindow is null.
    mainWindow.on('closed', () => mainWindow = null)
})

//Checks if the platform is Mac.
if(isMac){
    //If the platform is Mac then the menu is unshifted to the role - appMenu.
    menu.unshift({role: 'appMenu'})
}

//This checks if all windows are closed.
app.on('window-all-closed', () => {
    //This checks if the platform is Mac.
    if (!isMac) {
      //If the platform is not Mac, then the app will quit.  
      app.quit()
    }
})

//Checks if the app is active.
app.on('activate', () => {
    //Compares and checks if the number of windows opened is 0
    if (BrowserWindow.getAllWindows().length === 0) {
      //Creates a new window if the number of windows opened is 0  
      createMainWindow()
    }
})

//Some security bullshit.
app.allowRendererProcessReuse = true;
