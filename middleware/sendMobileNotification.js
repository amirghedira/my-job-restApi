var Request = require("request");
module.exports = (content, recipient) => {
    let notificationContent = ''
    const notification = JSON.parse(content)
    const notificationVariables = JSON.parse(notification.variables)
    switch (notification.type) {
        case 'appliedOffer':
            notificationContent = `${notificationVariables.user.firstName} ${notificationVariables.user.lastName} has applied to ${notificationVariables.offer.name}`
            break;
        case 'acceptedApplication':
            notificationContent = `Your application at ${notificationVariables.offer.name} has been accepted`


            break;
        case 'rejectedApplication':
            notificationContent = `Your application at ${notificationVariables.offer.name} has been rejected`
            break;

        case 'newOffer':
            notificationContent = `A new offer ${notificationVariables.offer.name} has been posted by ${notificationVariables.client.name}`

            break;
        case 'following':
            notificationContent = `${notificationVariables.user.firstName} ${notificationVariables.user.lastName} started following you`
            break;

        default:
            break;
    }
    Request.post({
        "headers": { "content-type": "application/json" },
        "url": "https://exp.host/--/api/v2/push/send",
        body: JSON.stringify({
            to: recipient,
            sound: 'default',
            icon: process.env.HOST + '/static/my-job.png',
            title: 'Notification',
            body: notificationContent,
            data: notification
        })

    }, (error, response, body) => {
        if (error) {
            return console.dir(error);
        }
        console.dir(JSON.parse(body));

    });

}


// mobileNotification("Order Payed", user.notificationToken)
