# How to Publish and Update the Extension

1. Create a [Visual Studio Team Services](https://visualstudio.microsoft.com/team-services) account.

2. Create a [publisher](https://docs.microsoft.com/en-us/vsts/extend/publish/overview?view=vsts#create-a-publisher).

3. Follow [these steps](https://docs.microsoft.com/en-us/vsts/extend/publish/command-line?view=vsts) to create an appropriately scoped personal access token:

    3.1. Make sure that the `Accounts` option is set to `All accessible accounts`.

    3.2. Make sure that the `Authorized Scopes` option is set to `Selected scopes`, and that `Marketplace (publish)` is checked.

4. Run `npm install` in the root directory of the project.

5. Make the following changes to the `vss-extension.json` file:

    5.1. On **Line 6** change the value of the `publisher` key from `tmdement` to the ID of the publisher you created in **Step 2**.

    5.2. On **Line 8** change the second value of the `targets` key from `tmdement.olaTrackingWidget.OlaWidget.Configuration` to use the ID of the publisher you created in **Step 2** instead of the blank.

6. Make the following changes to the `deploy.sh` file:

    6.1. On **Line 8** change the `$VSTS_MARKETPLACE_TOKEN` environment variable to reference the personal access token you created in **Step 3**.

    6.2. If you are publishing for the first time, comment out **Line 9** to prevent incrementing the patch number of the extension. For future publishing, this line must not be commented out.

7. Run the following command in the root directory of the project to package and publish the extension:

        tfx extension publish --token $VSTS_MARKETPLACE_TOKEN --output-path ./deployments/

    Make sure that the `$VSTS_MARKETPLACE_TOKEN` is properly set to reference the personal access token you created in **Step 3**.

8. On the [Visual Studio Marketplace Publishing Portal](http://aka.ms/vsmarketplace-manage) click the ellipsis next to `OLA Tracking Widget` and select `Share/Unshare`, then click the `+ Organization` button and type the name of the organization you'd like to share the extension with. For testing, you can use the Visual Studio Team Services account you created in **Step 1**.

9. From within the target Visual Studio Team Services account that the extension was shared with in **Step 8**, click the shopping bag icon in the top right and select `Manage Extensions`, then click `OLA Tracking Widget`.

10. On the `OLA Tracking Widget` marketplace page, click the green `Get it free` button, then select your Visual Studio Team Services organization and click the blue `Install` button.

11. Return to the target Visual Studio Team Services account that the extension was shared with in **Step 8** and navigate to any dashboard. Click the `Edit` button at the top of the dashboard, then scroll down to find the `OLA Tracking Widget` in the `Add Widget` list (widgets are sorted in alphabetical order). The widget can be dragged and dropped onto the dashboard, or you can select the `OLA Tracking Widget` and then click the blue `Add` button.

12. For details on how to configure and use the widget, please see the `README.md` file, which can be accessed in the marketplace by clicking the `Learn More` link included under the widget in the `Add Widget` list from **Step 11**.

13. After completing changes to the source code, run `deploy.sh` in the root directory of the project, ensuring that **Line 9** is not commented out. Note that restructuring the folders and files of the project will require you to update any paths referenced in the `vss-extension.json` file to reflect the restructuring.