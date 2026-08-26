Feature: Chat

  Scenario: A user sends a message to another user
    Given two registered users exist
    And the first user is logged in
    When the first user chats with the second user saying "Hey!"
    Then the message should be sent successfully