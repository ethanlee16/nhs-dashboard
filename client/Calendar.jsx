import React from 'react';
import _ from 'lodash';
import 'whatwg-fetch';
import Dialog from 'material-ui/Dialog';
import FlatButton from 'material-ui/FlatButton';
import { Col } from 'react-bootstrap';

const nondates = ['2016-10-19', '2016-11-22', '2016-11-23', '2016-11-24', '2016-12-13', '2016-12-14', '2016-12-15', '2016-12-20', '2016-12-21', '2016-12-22', '2016-12-27', '2016-12-28', '2016-12-29', '2017-01-03', '2017-02-01', '2017-04-18', '2017-04-19', '2017-04-20'];
const $ = require('jquery');
const firebase = require('firebase');
require('fullcalendar');

class Calendar extends React.Component {
  constructor(props) {
    super(props);
    this.close = ::this.close;
    this.save = ::this.save;
    this.remove = ::this.remove;
    this.selectDay = ::this.selectDay;
    this.state = {
      selecting: false,
    };
  }

  componentDidMount() {
    window.onbeforeunload = () => {
      this.remove();
    };

    $('#calendar').fullCalendar({
      weekends: false,
      dayClick: this.selectDay,
      dayRender: (date, cell) => {
        const day = date.day();
        const month = $('#calendar').fullCalendar('getDate').month();
        if (((day >= 2 && day <= 4)
            && month === date.month())
            && nondates.indexOf(date.format()) === -1) {
          cell.css('background-color', 'lightyellow');
        } else {
          cell.css('cursor', 'not-allowed');
        }
      },
    });

    this.props.db.ref('bookings').on('value', (snapshot) => {
      const bookings = _.mapValues(snapshot.val(), v => _.values(v));
      this.setState({ bookings });

      const unconfirmed = [];
      const confirmed = [];
      _.keys(bookings).forEach((k) => {
        bookings[k].forEach((v) => {
          const date = {
            start: k,
            title: v.substring(0, v.indexOf('@'))
                    .split('.').join(' '),
          };
          if (v.indexOf(';') === -1) {
            unconfirmed.push(date);
          } else {
            confirmed.push(date);
          }
        });
      });
      // console.log(JSON.stringify(source))

      $('#calendar').fullCalendar('removeEventSources');
      $('#calendar').fullCalendar('addEventSource', unconfirmed);
      $('#calendar').fullCalendar('addEventSource', {
        events: confirmed,
        color: 'green',
      });
    });
  }

  selectDay(date, event, view) {
    if (!(date.day() >= 2 && date.day() <= 4)
      || nondates.indexOf(date.format()) !== -1) return;
    const booking = this.props.db.ref(`bookings/${date.format()}`);
    booking.once('value').then((snapshot) => {
      // Continue immediately if empty date
      if (!snapshot.val()) return;

      let tutors = _.values(snapshot.val());
      tutors = tutors.map((tutor) => {
        if (tutor.indexOf(';') !== -1) {
          return tutor.substring(0, tutor.indexOf(';'));
        }
        return tutor;
      });
      if (tutors.indexOf(localStorage.email) !== -1) {
        throw new Error("Already scheduled tutoring for this date.");
      }
      if (tutors.length >= 3) {
        throw new Error('Three tutors have already reserved this date. '
          + 'If the appointment is green, it has been confirmed; otherwise, '
          + 'it might open up!');
      }
    }).then(() => {
      booking.push(localStorage.email);
      this.setState({
        selecting: true,
        date,
      });
    }).catch((err) => {
      clearTimeout(this.state.errorTimeout);
      const timeout = setTimeout(() => {
        this.setState({ error: null });
      }, 5000);
      this.setState({
        error: err.message,
        errorTimeout: timeout,
      });
    });
  }

  remove() {
    this.props.db
    .ref(`bookings/${this.state.date.format()}`)
    .transaction((bookings) => {
      const dates = Object.assign({}, bookings);
      const tutors = Object.keys(dates);
      tutors.forEach((tutor) => {
        if (dates[tutor] === localStorage.email) {
          delete dates[tutor];
        }
      });
      return dates;
    });
  }

  close() {
    this.remove();
    this.setState({ selecting: false });
  }

  save() {
    this.setState({
      saving: true,
    });
    fetch('/api/users/schedule', {
      method: 'POST',
      body: JSON.stringify({
        email: localStorage.email,
        date: this.state.date,
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    })
    .then(response => response.json())
    .then((response) => {
      if (!response.error) {
        this.setState({
          selecting: false,
          date: null,
          saving: false,
        });
      }
      // alert user that they have scheduled
    })
    .catch((err) => {
      console.error("An error has occurred. Please try again.");
    });
  }

  render() {
    let date;
    let errorMessage;
    if (this.state.date) {
      date = this.state.date.format('dddd, MMMM Do');
    }
    if (this.state.error) {
      errorMessage = (
        <div bsStyle="danger">
          <strong>Uh-oh! </strong>{this.state.error}
        </div>
      );
    }

    const actions = [
      <FlatButton
        onTouchTap={this.close}
        disabled={this.state.saving}
      >
        Cancel
      </FlatButton>,
      <FlatButton
        primary
        onTouchTap={this.save}
        disabled={this.state.saving}
      >
        {this.state.saving ? "Confirming..." : "Confirm"}
      </FlatButton>,
    ];

    return (
      <Col md={8}>
        { errorMessage }
        <div id="calendar" style={{ textTransform: 'capitalize' }} />
        <Dialog
          open={this.state.selecting}
          onRequestClose={this.close}
          modal
          title={date}
          actions={actions}
        >
          <p>You are now confirming your NHS tutoring session
           for <b>{date}</b>, from 2:05-3:00 PM.</p>
          <p>Would you like to save this date?&nbsp;
            <b>Make sure you are available before confirming!</b>
          </p>
        </Dialog>
      </Col>
    );
  }
}

Calendar.propTypes = {
  db: React.PropTypes.instanceOf(firebase.database.Database).isRequired,
};

export default Calendar;
