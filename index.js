'use strict';

const fetch = require('node-fetch')

const admin = require('firebase-admin')

const serivceAccount = require('./cowindata-6fe71-firebase-adminsdk-b8bvs-a99359f7c9.json')

const moment = require('moment')


admin.initializeApp({
    credential: admin.credential.cert(serivceAccount)
})


const db = admin.firestore();



// States
const getStates = async () => {
    const options = {
        'User-Agent': 'Bacon/1.0'
    }

    const state_response = await fetch(`https://cdn-api.co-vin.in/api/v2/admin/location/states`, { headers: options })

    const data = await state_response.json();

    const states = data.states;

    states.forEach((state) => {
        loadSession(state.state_id)
    })

    //console.log('Response Data', data);
}

getStates();

// Distircts
const getDistricts = async (id) => {
    const options = {
        'User-Agent': 'Bacon/1.0'
    }

    const district_response = await fetch(`https://cdn-api.co-vin.in/api/v2/admin/location/districts/${id}`, { headers: options })

    const data = await district_response.json();

    return data

}

// getDistricts();

// getSessions
function getSession(url) {
    return new Promise((resolve, reject) => {
        const options = {
            'User-Agent': 'Bacon/1.0'
        }

        fetch(url, options)
            .then((resp) => resp.json())
            .then((data) => {
                resolve(data)
            })
    })

}


// LoadSession
const loadSession = async (id) => {

    const disrictResult = await getDistricts(id);

    const districts = disrictResult.districts;

    let userRequest = [];

    let date = moment().format('DD-MM-YYYY');

    districts.forEach((district) => {
        userRequest.push(getSession(`https://cdn-api.co-vin.in/api/v2/appointment/sessions/public/calendarByDistrict?district_id=${district.district_id}&date=${date}`))

    })


    Promise.all(userRequest).then((allUserData) => {

        allUserData.forEach((data) => {

            data.centers.forEach((center) => {

                center.sessions.forEach((session) => {


                    const session_data = {
                        available: session.available_capacity,
                        age_limit: session.min_age_limit
                    }

                    // const result = db.collection('Cowin_Data_with_Date').doc(center.state_name)
                    //     .collection(center.district_name).doc(center.name.replace('/', ''))
                    //     .collection(session.date).doc(moment().format('hh:mm A')).set(session_data).then((dbresult) => { console.log("data saved -> ", dbresult) }).catch((dbError) => { console.error("Save DB Error -> " + Date.now() + " -> ", dbError) })

                    db.collection('Cowin_Data').doc(session.date).collection(moment().format('hh:mm A')).doc(center.state_name).collection(center.district_name).doc(center.name.replace('/', '')).set(session_data).then((dbresult) => { console.log("data saved -> ", dbresult) }).catch((dbError) => { console.error("Save DB Error -> " + Date.now() + " -> ", dbError) })




                })

            })

        })
    }).catch((fetchError) => {
        console.log("Not able to fetch the data at " + Date.now())
        console.error(fetchError);
    })

}

//loadSession();