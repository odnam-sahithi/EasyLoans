const Loan = require('../models/loan');
const Counter = require('../models/counter');
const GoogleUser = require('../models/googleuser');
const nodemailer = require('nodemailer');

module.exports.applicationForm = (req, res) => {
    res.render('loan/application');
}

module.exports.LoanDB = async (req, res) => {
    const { amount, interest, category, timePeriod } = req.body;
    const newLoan = new Loan({ amount, interest, category, timePeriod });
    newLoan.owner = req.user.id;
    newLoan.counters = [];
    await newLoan.save();

    const user = await GoogleUser.findById(req.user.id);
    user.loans.push(newLoan.id);
    await user.save();

    res.redirect('/home');
}


module.exports.editLoan = async (req, res) => {
    const { id } = req.params;
    const loan = await Loan.findById(id);
    res.render('loan/edit', { loan });
}

module.exports.updateLoan = async (req, res) => {
    const { id } = req.params;
    const { amount, interest, category, timePeriod } = req.body;
    await Loan.findByIdAndUpdate(id, { amount, interest, category, timePeriod });
    res.redirect('/home');
}

module.exports.deleteLoan = async (req, res) => {
    const { id } = req.params;
    await Loan.findByIdAndDelete(id);
    await GoogleUser.findByIdAndUpdate(req.user.id, { $pull: { loans: id } });
    res.redirect('/home');
}

module.exports.show = async (req, res) => {
    const { id } = req.params;
    const loan = await Loan.findById(id).populate('owner').populate({
        path: 'counters',
        populate: {
            path: 'owner' // populate author of each review
        }
    })
    res.render('loan/show', { loan });
}

module.exports.loanCounter = async (req, res) => {
    const { id } = req.params;
    const loan = await Loan.findById(id);
    const { amount, interest, timePeriod } = req.body;

    const newCounter = new Counter({ amount, interest, timePeriod, owner: req.user.id });

    loan.counters.push(newCounter);

    await loan.save();
    await newCounter.save();
    res.redirect(`/loan/${id}/show`);
}

module.exports.acceptCounter = async (req, res) => {
    const { id, c_id } = req.params;

    // remove all counters of the loan and store info about client
    const loan = await Loan.findById(id).populate('owner');
    const counter = await Counter.findById(c_id).populate('owner');
    const client = await GoogleUser.findById(counter.owner.id);

    client.loans.push(loan.id);
    await client.save();

    // deleting all counters from db
    await Counter.deleteMany({
        _id: { $in: loan.counters }
    })

    loan.counters = [];
    loan.isPending = false;
    loan.acceptedBy = counter.owner.id;

    // change interest and time period to counter values 
    loan.interest = counter.interest;
    loan.timePeriod = counter.timePeriod;
    await loan.save();


    var outputEmail;
    if (loan.category === 'provide') {
        outputEmail = `Hey!!! It's a deal 🤝
The finance provided by ${loan.owner.name} is accepted by ${client.name} in exchange for the counter made.
Final Details:
Amount:`;
    } else {
        outputEmail = `Hey!!! It's a deal 🤝 <br> The loan requested by ${loan.owner.name} is accepted to be financed by ${client.name} in exchange for the counter made.
Final Details:
Amount:`;
    }

    // create reusable transporter object using the default SMTP transport
    let transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
            user: 'marnisaisanjay@gmail.com', // generated ethereal user
            pass: '$@nj@y1109' // generated ethereal password
        },
        tls: {
            rejectUnauthorized: false
        }
    });

    // send mail with defined transport object
    let info = await transporter.sendMail({
        from: '"EasyLoans💰💲" <marnisaisanjay@gmail.com>', // sender address
        to: `${loan.owner.email}, ${client.email}`, // list of receivers
        subject: "News Letter from EasyLoans 📰", // Subject line
        // text: "Hello world?", // plain text body
        html: outputEmail, // html body
    }, (err, info) => {
        if (err) return console.log(err);
       
        // console.log("Message sent: %s", info.messageId);


    });


    res.redirect('/home');
}


module.exports.rejectCounter = async (req, res) => {
    const { id, c_id } = req.params;

    const loan = await Loan.findById(id);
    const counter = await Counter.findById(c_id).populate('owner');

    // Delete counter
    await Counter.findByIdAndDelete(c_id);
    // Remove it from counters of loan
    await Loan.findByIdAndUpdate(id, { $pull: { counters: c_id } });



    var outputEmail;
    if (loan.category === 'provide') {
        outputEmail = `
        Sorry 😔😔 <br />
        Thank you for your recent application. We regret that ${loan.owner.name} rejects your response for the counter you produced.
        Make a fresh offer and try again.<br/>
        <br/>
        Thanks and Regards <br />
        EasyLoans`;
    } else {
        outputEmail = ` Sorry 😔😔 <br />
        Thank you for your recent application. We regret that ${loan.owner.name} rejects your response for the counter you produced.
        Make a fresh offer and try again.
        <br/>
        Thanks and Regards <br />
        EasyLoans`;
    }

    // create reusable transporter object using the default SMTP transport
    let transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
            user: 'marnisaisanjay@gmail.com', // generated ethereal user
            pass: '$@nj@y1109' // generated ethereal password
        },
        tls: {
            rejectUnauthorized: false
        }
    });

    // send mail with defined transport object
    let info = await transporter.sendMail({
        from: '"EasyLoans💰💲" <marnisaisanjay@gmail.com>', // sender address
        to: `${counter.owner.email}`, // list of receivers
        subject: "News Letter from EasyLoans 📰", // Subject line
        // text: "Hello world?", // plain text body
        html: outputEmail, // html body
    }, (err, info) => {
        if (err) return console.log(err);
        
        // console.log("Message sent: %s", info.messageId);


    });



    res.redirect(`/loan/${id}/show`);

}

module.exports.acceptDirectly = async (req, res) => {
    const { id } = req.params;
    const loan = await Loan.findById(id).populate('owner');
    const client = await GoogleUser.findById(req.user.id);

    client.loans.push(loan.id);
    await client.save();

    loan.counters = [];
    loan.isPending = false;
    loan.acceptedBy = req.user.id;

    await loan.save();

    var outputEmail;
    if (loan.category === 'provide') {
        outputEmail = `Hey!!! It's a deal 🤝
The finance provided by ${loan.owner.name} is accepted by ${client.name}.
Final Details:
Amount:`;
    } else {
        outputEmail = `Hey!!! It's a deal 🤝 <br> The loan requested by ${loan.owner.name} is accepted to be financed by ${client.name}.
Final Details:
Amount:`;
    }
    // create reusable transporter object using the default SMTP transport
    let transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
            user: 'marnisaisanjay@gmail.com', // generated ethereal user
            pass: '$@nj@y1109' // generated ethereal password
        },
        tls: {
            rejectUnauthorized: false
        }
    });

    // send mail with defined transport object
    let info = await transporter.sendMail({
        from: '"EasyLoans💰💲" <marnisaisanjay@gmail.com>', // sender address
        to: `${loan.owner.email}, ${req.user.email}`, // list of receivers
        subject: "News Letter from EasyLoans 📰", // Subject line
        // text: "Hello world?", // plain text body
        html: outputEmail, // html body
    }, (err, info) => {
        if (err) return console.log(err);
        
        // console.log("Message sent: %s", info.messageId);


    });


    res.redirect('/home');
}