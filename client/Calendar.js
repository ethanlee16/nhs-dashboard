import React from 'react';
import _ from 'lodash';
import 'whatwg-fetch';
import { Modal, Col, Button, Alert, ProgressBar } from 'react-bootstrap';

const nondates = ['2016-10-19', '2016-11-22', '2016-11-23', '2016-11-24', '2016-12-13', '2016-12-14', '2016-12-15', '2016-12-20', '2016-12-21', '2016-12-22', '2016-12-27', '2016-12-28', '2016-12-29', '2017-01-03', '2017-02-01', '2017-04-18', '2017-04-19', '2017-04-20'];
var $ = require('jquery');
var fullCalendar = require('fullcalendar');

class Calendar extends React.Component {
    constructor(props) {
      super(props);
      this.close = ::this.close;
      this.save = ::this.save;
      this.remove = ::this.remove;
      this.selectDay = ::this.selectDay;
      this.onChange = ::this.onChange;
      this.state = {
        selecting: false
      }
    }

    componentDidMount() {
      window.onbeforeunload = () => {
        this.remove();
      }

      $('#calendar').fullCalendar({
        weekends: false,
        dayClick: this.selectDay,
        dayRender: (date, cell) => {
          var day = date.day();
          var month = $('#calendar').fullCalendar('getDate').month();
          if (((day >= 2 && day <= 4) 
              && month === date.month())
              && nondates.indexOf(date.format()) === -1 ) {
            cell.css('background-color', 'lightyellow');
          } else {
            cell.css('cursor', 'not-allowed');
          }
        }
      });
    }

    componentWillReceiveProps(nextProps) {
      if (nextProps.db) {
        nextProps.db.ref('bookings').on('value', snapshot => {
          var bookings = _.mapValues(snapshot.val(), v => _.values(v));
          this.setState({ bookings })

          let unconfirmed = [];
          let confirmed = [];
          _.keys(bookings).forEach(k => {
            bookings[k].forEach(v => {
              let date = {
                start: k,
                title: v.substring(0, v.indexOf('@'))
                        .split('.').join(' ')
              };
              if (v.indexOf(';') === -1) {
                unconfirmed.push(date)
              } else {
                confirmed.push(date);
              }
            })
          })
          // console.log(JSON.stringify(source))

          $('#calendar').fullCalendar('removeEventSources');
          $('#calendar').fullCalendar('addEventSource', unconfirmed);
          $('#calendar').fullCalendar('addEventSource', {
            events: confirmed,
            color: 'green'
          });
        });
      }
    }

    selectDay(date, event, view) {
      if (!(date.day() >= 2 && date.day() <= 4)
        || nondates.indexOf(date.format()) !== -1) return;
      let booking = this.props.db.ref('bookings/' + date.format());
      booking.once('value').then(snapshot => {
        // Continue immediately if empty date
        if (!snapshot.val()) return;

        let tutors = _.values(snapshot.val());
        tutors = tutors.map(tutor => {
          if (tutor.indexOf(';') !== -1) {
            return tutor.substring(0, tutor.indexOf(';'));
          }
          return tutor;
        });
        if (tutors.indexOf(localStorage.email) !== -1) {
          throw new Error("Already scheduled tutoring for this date.");
        }
        if (tutors.length >= 2) {
          throw new Error("Two tutors have already reserved this date. \
            If the appointment is green, it has been confirmed; otherwise, \
            it might open up!");
        }
      }).then(() => {
        booking.push(localStorage.email);
        this.setState({
          selecting: true,
          date: date
        });
      }).catch(err => {
        clearTimeout(this.state.errorTimeout);
        let timeout = setTimeout(() => {
          this.setState({ error: null })
        }, 5000);
        this.setState({
          error: err.message,
          errorTimeout: timeout
        });
      });
    }

    remove() {
      this.props.db
      .ref('bookings/' + this.state.date.format())
      .transaction(bookings => {
        for (var tutor in bookings) {
          if (bookings[tutor] === localStorage.email) {
            delete bookings[tutor];
          }
        }
        return bookings;
      });
    }

    close() {
      this.remove();
      this.setState({selecting: false}); 
    }

    save() {
      this.setState({
        saving: true
      });
      fetch('/api/users/schedule', {
        method: 'POST',
        body: JSON.stringify({
          email: localStorage.email,
          date: this.state.date
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      })
      .then(response => response.json())
      .then(response => {
        if (!response.error) this.setState({
          selecting: false,
          date: null,
          saving: false
        });
        // alert user that they have scheduled
      })
      .catch(err => {
        console.error("An error has occurred. Please try again.");
      });
    }

    onChange(e) {
      localStorage.email = e.target.value;
    }

    render() {
      let date;
      let errorMessage;
      if (this.state.date) {
        date = this.state.date.format('dddd, MMMM Do')
      }
      if (this.state.error) {
        errorMessage = <Alert bsStyle="danger">
          <strong>Uh-oh! </strong>{this.state.error}
        </Alert>
      }
      return (
        <Col md={8}>
          { errorMessage }
          <div id="calendar" style={{textTransform: 'capitalize'}}>
          </div>
          <Modal show={this.state.selecting} onHide={this.close}>
            <Modal.Header closeButton>
              <Modal.Title>{date}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <p>You are now confirming your NHS tutoring session 
              for <b>{date}</b>, from 2:05-3:00 PM.</p>
              <p>Would you like to save this date?&nbsp;
                <b>Make sure you are available before confirming!</b>
              </p>
            </Modal.Body>
            <Modal.Footer>
              <Button onClick={this.close} 
                      disabled={this.state.saving}>
                Cancel
              </Button>
              <Button bsStyle="primary"
                      onClick={this.save}
                      disabled={this.state.saving}>
                {this.state.saving ? "Confirming..." : "Confirm"}
              </Button>
            </Modal.Footer>
        </Modal>
        </Col>
      );
    }
}

export default Calendar;