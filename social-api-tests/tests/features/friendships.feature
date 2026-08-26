Feature: Friend requests

  Scenario: A user sends a friend request
    Given two registered users exist
    When the first user sends a friend request to the second user
    Then the friend request should succeed

  Scenario: A user accepts a friend request
    Given two registered users exist
    And the first user has sent a friend request to the second user
    When the second user accepts the friend request
    Then the users should be friends