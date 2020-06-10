const sgMail = require('@sendgrid/mail')

sgMail.setApiKey(process.env.SENDGRID_API_KEY)

sgMail.send({
    to: 'ogulikss@gmail.com',
    from: 'pahonski@gmail.com',
    subject: 'This is my first email from node js!',
    text: 'I hope this one actually gets to you.'
})