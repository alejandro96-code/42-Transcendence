Feature: Mentions

  Scenario: A user mentions another user in a post
    Given two registered users exist
    And the first user is logged in
    When the first user makes a post mentioning the second user
    Then the post should be created successfully
    And the second user should be mentioned